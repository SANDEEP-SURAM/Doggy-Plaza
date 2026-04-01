from flask import Blueprint, request, jsonify
from db import get_conn
import json

order_routes = Blueprint('orders', __name__)

@order_routes.post("/api/orders")
def create_order():
    data = request.get_json(force=True)

    conn = get_conn()
    conn.execute(
        "INSERT INTO orders (name, phone, address, items_json, total, status) VALUES (?,?,?,?,?,?)",
        (data["name"], data["phone"], data["address"], json.dumps(data["items"]), data["total"], "Pending")
    )
    conn.commit()
    conn.close()

    return jsonify({"ok": True})


@order_routes.get("/api/orders")
def list_orders():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM orders").fetchall()
    conn.close()

    orders = []
    for r in rows:
        orders.append({
            "id": r["id"],
            "name": r["name"],
            "items": json.loads(r["items_json"]),
            "total": r["total"],
            "status": r["status"]
        })

    return jsonify(orders)

@order_routes.patch("/api/orders/<int:order_id>/status")
def update_status(order_id):
    data = request.get_json()
    status = data.get("status")

    conn = get_conn()
    conn.execute(
        "UPDATE orders SET status=? WHERE id=?",
        (status, order_id)
    )
    conn.commit()
    conn.close()

    return jsonify({"ok": True})


@order_routes.delete("/api/orders/<int:order_id>")
def delete_order(order_id):
    conn = get_conn()
    conn.execute("DELETE FROM orders WHERE id=?", (order_id,))
    conn.commit()
    conn.close()

    return jsonify({"ok": True})