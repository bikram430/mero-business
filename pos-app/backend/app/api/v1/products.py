from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_merchant
from app.models.merchant import Merchant
from app.models.product import Product
from app.schemas.product import ProductCreateRequest, ProductUpdateRequest, ProductResponse

router = APIRouter()


@router.get("", response_model=List[ProductResponse])
def list_products(
    merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    return db.query(Product).filter(
        Product.merchant_id == merchant.id,
        Product.is_active == True,
    ).order_by(Product.name).all()


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreateRequest,
    merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    product = Product(
        merchant_id=merchant.id,
        name=payload.name,
        price=payload.price,
        barcode=payload.barcode,
        stock_qty=payload.stock_qty,
        category=payload.category,
        description=payload.description,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: UUID,
    payload: ProductUpdateRequest,
    merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.merchant_id == merchant.id,
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: UUID,
    merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.merchant_id == merchant.id,
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.is_active = False   # soft-delete — preserves receipt history
    db.commit()
