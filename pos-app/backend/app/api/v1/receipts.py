"""Public receipt endpoint — no auth required, used by customers viewing receipt links."""
import io
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.transaction import Transaction, TransactionStatus
from app.models.merchant import Merchant

router = APIRouter()


class PublicReceiptItemResponse(BaseModel):
    product_name: str
    qty: int
    unit_price: int

    class Config:
        from_attributes = True


class PublicReceiptResponse(BaseModel):
    id: UUID
    merchant_name: str
    merchant_address: Optional[str]
    total_amount: int
    discount_amount: int
    payment_method: str
    payment_status: str
    table_number: Optional[str]
    created_at: Optional[str]
    items: List[PublicReceiptItemResponse]


@router.get("/public/{transaction_id}", response_model=PublicReceiptResponse)
def get_public_receipt(transaction_id: UUID, db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Receipt not found")

    merchant = db.query(Merchant).filter(Merchant.id == tx.merchant_id).first()

    return PublicReceiptResponse(
        id=tx.id,
        merchant_name=merchant.name if merchant else "Unknown",
        merchant_address=merchant.address if merchant else None,
        total_amount=tx.total_amount,
        discount_amount=tx.discount_amount,
        payment_method=tx.payment_method.value if hasattr(tx.payment_method, 'value') else str(tx.payment_method),
        payment_status=tx.payment_status.value if hasattr(tx.payment_status, 'value') else str(tx.payment_status),
        table_number=tx.table_number,
        created_at=tx.created_at.isoformat() if tx.created_at else None,
        items=[
            PublicReceiptItemResponse(
                product_name=item.product_name,
                qty=item.qty,
                unit_price=item.unit_price,
            )
            for item in tx.items
        ],
    )


@router.get("/{transaction_id}/pdf")
def get_receipt_pdf(transaction_id: UUID, db: Session = Depends(get_db)):
    """Generate a thermal-style PDF receipt with QR code. No auth required."""
    from reportlab.lib.pagesizes import A6
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image as RLImage
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
    import qrcode

    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Receipt not found")

    merchant = db.query(Merchant).filter(Merchant.id == tx.merchant_id).first()
    merchant_name = merchant.name if merchant else "Mero Business"
    merchant_address = (merchant.address if merchant else None) or ""
    receipt_url = f"https://merobusiness.com.np/receipt/{transaction_id}"

    # Generate QR code as image bytes
    qr_img = qrcode.make(receipt_url)
    qr_buf = io.BytesIO()
    qr_img.save(qr_buf, format="PNG")
    qr_buf.seek(0)

    buf = io.BytesIO()
    # Thermal receipt width ~80mm
    page_width = 80 * mm
    doc = SimpleDocTemplate(
        buf,
        pagesize=(page_width, 200 * mm),
        leftMargin=4 * mm,
        rightMargin=4 * mm,
        topMargin=6 * mm,
        bottomMargin=6 * mm,
    )

    def style(size=9, bold=False, align=TA_LEFT, color=colors.black):
        return ParagraphStyle(
            "s",
            fontSize=size,
            fontName="Helvetica-Bold" if bold else "Helvetica",
            alignment=align,
            textColor=color,
            leading=size * 1.3,
        )

    def rs(paisa: int) -> str:
        return f"Rs {paisa // 100:,}"

    receipt_id = str(tx.id)[:8].upper()
    created = tx.created_at.strftime("%Y-%m-%d %H:%M") if tx.created_at else ""
    payment = tx.payment_method.value.upper() if hasattr(tx.payment_method, "value") else str(tx.payment_method).upper()

    story = [
        Paragraph(merchant_name, style(14, bold=True, align=TA_CENTER)),
    ]
    if merchant_address:
        story.append(Paragraph(merchant_address, style(8, align=TA_CENTER, color=colors.grey)))
    story += [
        Spacer(1, 2 * mm),
        HRFlowable(width="100%", thickness=0.5, color=colors.grey),
        Spacer(1, 1 * mm),
        Paragraph(f"Receipt #: {receipt_id}", style(8)),
        Paragraph(f"Date: {created}", style(8)),
        Spacer(1, 2 * mm),
        HRFlowable(width="100%", thickness=0.5, color=colors.grey),
        Spacer(1, 1 * mm),
    ]

    # Items table
    col_w = [page_width * 0.45, page_width * 0.15, page_width * 0.2, page_width * 0.2]
    item_data = [["Item", "Qty", "Price", "Total"]]
    subtotal = 0
    for item in tx.items:
        line_total = item.unit_price * item.qty
        subtotal += line_total
        item_data.append([
            Paragraph(item.product_name, style(8)),
            str(item.qty),
            rs(item.unit_price),
            rs(line_total),
        ])

    t = Table(item_data, colWidths=col_w)
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, colors.grey),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
    ]))
    story.append(t)
    story.append(Spacer(1, 2 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
    story.append(Spacer(1, 1 * mm))

    # Totals
    if tx.discount_amount > 0:
        story.append(Paragraph(f"Subtotal: {rs(subtotal)}", style(9, align=TA_RIGHT)))
        story.append(Paragraph(f"Discount: -{rs(tx.discount_amount)}", style(9, align=TA_RIGHT, color=colors.red)))
    story.append(Paragraph(f"<b>Total: {rs(tx.total_amount)}</b>", style(11, align=TA_RIGHT)))
    story.append(Paragraph(f"Payment: {payment}", style(9, align=TA_RIGHT)))
    story.append(Spacer(1, 3 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
    story.append(Spacer(1, 3 * mm))

    # QR code
    story.append(Paragraph("Scan for digital receipt", style(8, align=TA_CENTER, color=colors.grey)))
    story.append(Spacer(1, 2 * mm))
    qr_flowable = RLImage(qr_buf, width=28 * mm, height=28 * mm)
    qr_flowable.hAlign = "CENTER"
    story.append(qr_flowable)
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph("Powered by Mero Business", style(7, align=TA_CENTER, color=colors.grey)))

    doc.build(story)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=receipt-{receipt_id}.pdf"},
    )
