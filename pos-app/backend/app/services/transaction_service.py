from typing import List


def calculate_total(items: List[dict], discount_amount: int = 0) -> int:
    """Returns total in paisa after applying discount."""
    subtotal = sum(item["qty"] * item["unit_price"] for item in items)
    total = subtotal - discount_amount
    return max(total, 0)
