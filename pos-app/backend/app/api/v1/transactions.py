from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_esewa_hmac, verify_fonepay_hmac
from app.core.rate_limit import check_payment_rate
from app.api.deps import get_current_merchant
from app.models.merchant import Merchant
from app.models.product import Product
from app.models.transaction import Transaction, ReceiptItem, TransactionStatus, PaymentMethod
from app.models.customer import Customer
from app.schemas.transaction import (
    CreateTransactionRequest, PaymentWebhookRequest,
    TransactionResponse, SendReceiptRequest,
)
from app.services.transaction_service import calculate_total
from app.services.notification_service import send_receipt

router = APIRouter()


@router.get("", response_model=List[TransactionResponse])
def list_transactions(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    return (
        db.query(Transaction)
        .filter(Transaction.merchant_id == merchant.id)
        .order_by(Transaction.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    payload: CreateTransactionRequest,
    background_tasks: BackgroundTasks,
    merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    # Payment rate guard — max 20 per minute per merchant (prevents scripted attacks)
    check_payment_rate(str(merchant.id))

    # Idempotency check — prevent double charges
    if payload.idempotency_key:
        existing = db.query(Transaction).filter(
            Transaction.idempotency_key == payload.idempotency_key
        ).first()
        if existing:
            return existing

    # Validate items, check stock, fetch product snapshots
    # .with_for_update() prevents race condition: two concurrent sales can't both read the same stock
    items_data = []
    for item in payload.items:
        product = db.query(Product).filter(
            Product.id == item.product_id,
            Product.merchant_id == merchant.id,
            Product.is_active == True,
        ).with_for_update().first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if product.stock_qty is not None and product.stock_qty < item.qty:
            raise HTTPException(
                status_code=400,
                detail=f"'{product.name}' ko stock kam cha — {product.stock_qty} baki cha, {item.qty} maagyo",
            )
        items_data.append({
            "product": product,
            "product_name": product.name,
            "qty": item.qty,
            "unit_price": item.unit_price,
        })

    total = calculate_total(items_data, payload.discount_amount)

    # Look up or create customer
    customer = None
    if payload.customer_phone:
        customer = db.query(Customer).filter(Customer.phone == payload.customer_phone).first()
        if not customer:
            customer = Customer(phone=payload.customer_phone)
            db.add(customer)
            db.flush()

    tx = Transaction(
        merchant_id=merchant.id,
        customer_id=customer.id if customer else None,
        customer_phone=payload.customer_phone,
        total_amount=total,
        discount_amount=payload.discount_amount,
        payment_method=payload.payment_method,
        payment_status=TransactionStatus.PAID if payload.payment_method in (PaymentMethod.CASH, PaymentMethod.KHATA) else TransactionStatus.PENDING,
        table_number=payload.table_number,
        idempotency_key=payload.idempotency_key,
    )
    db.add(tx)
    db.flush()

    for item in items_data:
        db.add(ReceiptItem(
            transaction_id=tx.id,
            product_id=item["product"].id,
            product_name=item["product_name"],
            qty=item["qty"],
            unit_price=item["unit_price"],
        ))
        # Decrement stock if tracked
        if item["product"].stock_qty is not None:
            item["product"].stock_qty -= item["qty"]

    db.commit()
    db.refresh(tx)

    # Send receipt for all paid transactions when customer phone is available
    if payload.customer_phone and tx.payment_status == TransactionStatus.PAID:
        receipt_data = {
            "merchant_name": merchant.name,
            "merchant_address": getattr(merchant, "address", None),
            "items": [
                {"name": i["product_name"], "qty": i["qty"], "price": i["unit_price"]}
                for i in items_data
            ],
            "subtotal": sum(i["unit_price"] * i["qty"] for i in items_data),
            "discount": payload.discount_amount,
            "total": total,
            "payment_method": payload.payment_method.value,
            "receipt_id": str(tx.id)[:8].upper(),
        }
        background_tasks.add_task(send_receipt, tx.id, payload.customer_phone, "whatsapp", receipt_data)

    return tx


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: UUID,
    merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    tx = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.merchant_id == merchant.id,
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx


@router.post("/{transaction_id}/receipt")
def send_receipt_manually(
    transaction_id: UUID,
    payload: SendReceiptRequest,
    background_tasks: BackgroundTasks,
    merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    tx = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.merchant_id == merchant.id,
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    phone = payload.phone or tx.customer_phone
    if not phone:
        raise HTTPException(status_code=400, detail="No phone number on record — provide phone in request body")

    background_tasks.add_task(send_receipt, tx.id, phone, payload.channel)
    return {"message": "Receipt queued for delivery"}


@router.post("/webhook/esewa")
def esewa_webhook(payload: PaymentWebhookRequest, db: Session = Depends(get_db)):
    """
    eSewa calls this after payment. NEVER mark paid from mobile client —
    always verify server-side via HMAC before updating status.
    """
    data_string = f"{payload.transaction_id},{payload.amount},{payload.status}"
    if not verify_esewa_hmac(data_string, payload.signature):
        raise HTTPException(status_code=400, detail="Invalid HMAC signature")

    tx = db.query(Transaction).filter(
        Transaction.idempotency_key == payload.transaction_id
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Validate payment amount matches stored total — prevent underpayment attacks
    if payload.amount != tx.total_amount:
        raise HTTPException(status_code=400, detail="Payment amount mismatch — rejecting webhook")

    if payload.status == "COMPLETE":
        tx.payment_status = TransactionStatus.PAID
        tx.gateway_ref = payload.transaction_id
    else:
        tx.payment_status = TransactionStatus.FAILED

    db.commit()
    return {"status": "ok"}


@router.post("/webhook/fonepay")
def fonepay_webhook(payload: PaymentWebhookRequest, db: Session = Depends(get_db)):
    """Same server-side verification for Fonepay (NQR) webhooks."""
    data_string = f"{payload.transaction_id},{payload.amount},{payload.status}"
    if not verify_fonepay_hmac(data_string, payload.signature):
        raise HTTPException(status_code=400, detail="Invalid HMAC signature")

    tx = db.query(Transaction).filter(
        Transaction.idempotency_key == payload.transaction_id
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Validate payment amount matches stored total — prevent underpayment attacks
    if payload.amount != tx.total_amount:
        raise HTTPException(status_code=400, detail="Payment amount mismatch — rejecting webhook")

    tx.payment_status = TransactionStatus.PAID if payload.status == "SUCCESS" else TransactionStatus.FAILED
    tx.gateway_ref = payload.transaction_id
    db.commit()
    return {"status": "ok"}
