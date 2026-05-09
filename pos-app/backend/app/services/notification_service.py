import httpx
from uuid import UUID
from typing import Optional, List

from app.core.config import settings


def _format_rs(paisa: int) -> str:
    return f"Rs {paisa // 100:,}"


def _build_message(receipt_url: str, receipt_data: Optional[dict]) -> str:
    if not receipt_data:
        return f"Mero Business — your receipt is ready:\n{receipt_url}"

    merchant = receipt_data.get("merchant_name", "Mero Business")
    address = receipt_data.get("merchant_address") or ""
    items: List[dict] = receipt_data.get("items", [])
    subtotal = receipt_data.get("subtotal", 0)
    discount = receipt_data.get("discount", 0)
    total = receipt_data.get("total", 0)
    method = receipt_data.get("payment_method", "").upper()
    receipt_id = receipt_data.get("receipt_id", "")

    lines = [f"*{merchant}*"]
    if address:
        lines.append(address)
    lines.append(f"Receipt #{receipt_id}")
    lines.append("─" * 28)

    for item in items:
        name = item["name"][:18]
        qty = item["qty"]
        price = _format_rs(item["price"] * qty)
        lines.append(f"{name} ×{qty}  {price}")

    lines.append("─" * 28)
    if discount > 0:
        lines.append(f"Subtotal     {_format_rs(subtotal)}")
        lines.append(f"Discount    -{_format_rs(discount)}")
    lines.append(f"*Total       {_format_rs(total)}*")
    lines.append(f"Payment: {method}")
    lines.append("")
    lines.append(f"Digital copy: {receipt_url}")

    return "\n".join(lines)


async def send_receipt(
    transaction_id: UUID,
    phone: str,
    channel: str = "whatsapp",
    receipt_data: Optional[dict] = None,
):
    """
    Send receipt via WhatsApp (primary) or SMS (fallback).
    Called as a BackgroundTask so it never blocks the payment response.
    """
    receipt_url = f"https://merobusiness.com.np/receipt/{transaction_id}"
    message = _build_message(receipt_url, receipt_data)

    if channel == "whatsapp":
        await _send_whatsapp(phone, message)
    else:
        # SMS has 160-char limit — send shortened version
        sms_msg = f"{receipt_data.get('merchant_name', 'Mero Business')} - {_format_rs(receipt_data.get('total', 0))} ({receipt_data.get('payment_method','').upper()}) Receipt: {receipt_url}" if receipt_data else f"Mero Business receipt: {receipt_url}"
        await _send_sms(phone, sms_msg)


async def _send_whatsapp(phone: str, message: str):
    """WhatsApp Business API via Twilio or 360dialog — ~Rs 3–5 per message."""
    if not settings.WHATSAPP_API_TOKEN:
        return

    async with httpx.AsyncClient() as client:
        await client.post(
            settings.WHATSAPP_API_URL,
            headers={"Authorization": f"Bearer {settings.WHATSAPP_API_TOKEN}"},
            json={"to": f"whatsapp:+977{phone}", "body": message},
            timeout=10,
        )


async def _send_sms(phone: str, message: str):
    """Sparrow SMS — Nepal-based, cheapest SMS gateway."""
    if not settings.SPARROW_SMS_TOKEN:
        return

    async with httpx.AsyncClient() as client:
        await client.post(
            "https://api.sparrowsms.com/v2/sms/",
            data={
                "token": settings.SPARROW_SMS_TOKEN,
                "from": settings.SPARROW_SMS_SENDER,
                "to": phone,
                "text": message,
            },
            timeout=10,
        )
