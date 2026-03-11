from flask import Flask, request, jsonify, send_from_directory, abort
from flask_cors import CORS
from pathlib import Path
import json
import secrets
from datetime import datetime, timedelta
import random
import time
import smtplib
from email.message import EmailMessage


# ----------------------------
# OTP store (phone -> otp, expiry, name)
# ----------------------------
otp_store = {}
GMAIL_USER = "sandeeparjun485@gmail.com"
GMAIL_APP_PASSWORD = "vqga lxqe vidn pwpa"
def send_email_otp(email, otp):
    msg = EmailMessage()
    msg["Subject"] = "Your Doggy Plaza OTP"
    msg["From"] = GMAIL_USER
    msg["To"] = email
    msg.set_content(
        f"Your OTP is {otp}. Valid for 5 minutes."
    )

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        server.send_message(msg)

from werkzeug.security import generate_password_hash, check_password_hash
from db import init_db, get_conn

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
FRONTEND_DIR = PROJECT_DIR   # ✅ your index.html is here

print("FRONTEND_DIR =", FRONTEND_DIR)
print("INDEX EXISTS =", (FRONTEND_DIR / "index.html").exists())
app = Flask(__name__)
CORS(app)

init_db()

# ----------------------------
# Helper: admin auth
# ----------------------------
def _expires_str(hours=24):
    return (datetime.now() + timedelta(hours=hours)).strftime("%Y-%m-%d %H:%M:%S")

def require_admin():
    token = request.headers.get("X-Admin-Token", "").strip()
    if not token:
        return False

    conn = get_conn()
    row = conn.execute(
        "SELECT token, expires_at FROM sessions WHERE token=?",
        (token,)
    ).fetchone()
    conn.close()

    if not row:
        return False

    try:
        exp = datetime.strptime(row["expires_at"], "%Y-%m-%d %H:%M:%S")
        if datetime.now() > exp:
            conn = get_conn()
            conn.execute("DELETE FROM sessions WHERE token=?", (token,))
            conn.commit()
            conn.close()
            return False
    except:
        return False

    return True

# ----------------------------
# Serve frontend files (NO AUTH HERE)
# ----------------------------
@app.get("/")
def home():
    return send_from_directory(FRONTEND_DIR, "index.html")

@app.get("/<path:filename>")
def static_files(filename):
    return send_from_directory(FRONTEND_DIR, filename)

# ----------------------------
# Admin setup (create default admin once)
# ----------------------------
@app.post("/api/admin/setup")
def admin_setup():
    data = request.get_json(force=True)
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if not username or not password:
        return jsonify({"ok": False, "error": "username & password required"}), 400

    conn = get_conn()
    exists = conn.execute("SELECT id FROM admins LIMIT 1").fetchone()
    if exists:
        conn.close()
        return jsonify({"ok": False, "error": "Admin already exists"}), 400

    pw_hash = generate_password_hash(password)
    conn.execute("INSERT INTO admins (username, password_hash) VALUES (?,?)", (username, pw_hash))
    conn.commit()
    conn.close()
    return jsonify({"ok": True})

# ----------------------------
# Admin login/logout
# ----------------------------
@app.post("/api/admin/login")
def admin_login():
    data = request.get_json(force=True)
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if not username or not password:
        return jsonify({"ok": False, "error": "username & password required"}), 400

    conn = get_conn()
    admin = conn.execute("SELECT * FROM admins WHERE username=?", (username,)).fetchone()
    if not admin:
        conn.close()
        return jsonify({"ok": False, "error": "Invalid credentials"}), 401

    if not check_password_hash(admin["password_hash"], password):
        conn.close()
        return jsonify({"ok": False, "error": "Invalid credentials"}), 401

    token = secrets.token_urlsafe(32)
    expires_at = _expires_str(hours=24)

    conn.execute(
        "INSERT INTO sessions (token, admin_id, expires_at) VALUES (?,?,?)",
        (token, admin["id"], expires_at)
    )
    conn.commit()
    conn.close()

    return jsonify({"ok": True, "token": token, "expires_at": expires_at})

@app.post("/api/admin/logout")
def admin_logout():
    if not require_admin():
        return jsonify({"ok": False, "error": "Not logged in"}), 401

    token = request.headers.get("X-Admin-Token", "").strip()
    conn = get_conn()
    conn.execute("DELETE FROM sessions WHERE token=?", (token,))
    conn.commit()
    conn.close()
    return jsonify({"ok": True})

# ----------------------------
# Demo products API (optional)
# ----------------------------
PRODUCTS = [
    {"id": 1, "name": "Dog Food Premium", "price": 399, "category": "dogfood"},
    {"id": 2, "name": "Chew Toy", "price": 199, "category": "toys"},
    {"id": 3, "name": "Dog Collar", "price": 149, "category": "accessories"},
]

@app.get("/api/products")
def get_products():
    category = request.args.get("category")
    if category:
        return jsonify([p for p in PRODUCTS if p["category"] == category])
    return jsonify(PRODUCTS)

# ----------------------------
# Orders API
#   - POST is public (customer places order)
#   - GET/PATCH/DELETE are admin-only
# ----------------------------
@app.post("/api/orders")
def create_order():
    data = request.get_json(force=True)

    name = data.get("name", "")
    phone = data.get("phone", "")
    address = data.get("address", "")
    items = data.get("items", [])
    total = float(data.get("total", 0))
    status = "Pending"

    if not items or total <= 0:
        return jsonify({"ok": False, "error": "Invalid order"}), 400

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO orders (name, phone, address, items_json, total, status) VALUES (?,?,?,?,?,?)",
        (name, phone, address, json.dumps(items), total, status)
    )
    conn.commit()
    order_id = cur.lastrowid
    conn.close()

    return jsonify({"ok": True, "order_id": order_id})

@app.get("/api/orders")
def list_orders():
    if not require_admin():
        return jsonify({"ok": False, "error": "Unauthorized"}), 401

    conn = get_conn()
    rows = conn.execute("SELECT * FROM orders ORDER BY id DESC").fetchall()
    conn.close()

    orders = []
    for r in rows:
        orders.append({
            "id": r["id"],
            "name": r["name"],
            "phone": r["phone"],
            "address": r["address"],
            "items": json.loads(r["items_json"]),
            "total": r["total"],
            "status": r["status"],
            "created_at": r["created_at"],
        })
    return jsonify(orders)

@app.patch("/api/orders/<int:order_id>/status")
def update_order_status(order_id):
    if not require_admin():
        return jsonify({"ok": False, "error": "Unauthorized"}), 401

    data = request.get_json(force=True)
    status = (data.get("status") or "").strip()
    allowed = {"Pending", "Confirmed", "Delivered", "Cancelled"}

    if status not in allowed:
        return jsonify({"ok": False, "error": "Invalid status"}), 400

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("UPDATE orders SET status=? WHERE id=?", (status, order_id))
    conn.commit()
    updated = cur.rowcount
    conn.close()

    if updated == 0:
        return jsonify({"ok": False, "error": "Order not found"}), 404
    return jsonify({"ok": True})

@app.delete("/api/orders/<int:order_id>")
def delete_order(order_id):
    if not require_admin():
        return jsonify({"ok": False, "error": "Unauthorized"}), 401

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM orders WHERE id=?", (order_id,))
    conn.commit()
    deleted = cur.rowcount
    conn.close()

    if deleted == 0:
        return jsonify({"ok": False, "error": "Order not found"}), 404
    return jsonify({"ok": True})

@app.post("/api/send-otp")
def send_otp():
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip()
    name = (data.get("name") or "").strip()

    if not email or "@" not in email:
        return jsonify({"ok": False, "error": "Invalid email"}), 400

    otp = random.randint(100000, 999999)

    otp_store[email] = {
        "otp": str(otp),
        "name": name,
        "expires": time.time() + 300
    }

    try:
        send_email_otp(email, otp)
    except Exception as e:
        print("EMAIL ERROR:", e)
        return jsonify({"ok": False, "error": "Failed to send OTP"}), 500

    return jsonify({"ok": True, "message": "OTP sent to email"})


@app.post("/api/verify-otp")
def verify_otp():
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip()
    otp = (data.get("otp") or "").strip()

    record = otp_store.get(email)

    if not record:
        return jsonify({"ok": False, "error": "OTP not found"}), 400

    if time.time() > record["expires"]:
        del otp_store[email]
        return jsonify({"ok": False, "error": "OTP expired"}), 400

    if otp != record["otp"]:
        return jsonify({"ok": False, "error": "Invalid OTP"}), 400

    user = {
        "name": record["name"],
        "email": email
    }

    del otp_store[email]

    return jsonify({"ok": True, "user": user})
# ----------------------------
# Contact API (public)
# ----------------------------
@app.post("/api/contact")
def contact():
    data = request.get_json(force=True)

    name = data.get("name", "")
    email = data.get("email", "")
    message = data.get("message", "")

    if not message.strip():
        return jsonify({"ok": False, "error": "Message required"}), 400

    conn = get_conn()
    conn.execute(
        "INSERT INTO contacts (name, email, message) VALUES (?,?,?)",
        (name, email, message)
    )
    conn.commit()
    conn.close()

    return jsonify({"ok": True})

if __name__ == "__main__":
    app.run(debug=True)