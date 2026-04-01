from flask import Blueprint, request, jsonify
from db import get_conn
from werkzeug.security import check_password_hash, generate_password_hash
import secrets
from datetime import datetime, timedelta
import random
import smtplib
from email.mime.text import MIMEText

auth_routes = Blueprint('auth', __name__)


def _expires_str(hours=24):
    return (datetime.now() + timedelta(hours=hours)).strftime("%Y-%m-%d %H:%M:%S")


# ---------------- ADMIN LOGIN ----------------
@auth_routes.post("/api/admin/login")
def admin_login():
    data = request.get_json(force=True)
    username = data.get("username")
    password = data.get("password")

    conn = get_conn()
    admin = conn.execute(
        "SELECT * FROM admins WHERE username=?",
        (username,)
    ).fetchone()

    if not admin or not check_password_hash(admin["password_hash"], password):
        return jsonify({"ok": False, "error": "Invalid credentials"}), 401

    token = secrets.token_urlsafe(32)
    expires_at = _expires_str()

    conn.execute(
        "INSERT INTO sessions (token, admin_id, expires_at) VALUES (?,?,?)",
        (token, admin["id"], expires_at)
    )
    conn.commit()
    conn.close()

    return jsonify({"ok": True, "token": token})


# ---------------- ADMIN SETUP ----------------
@auth_routes.post("/api/admin/setup")
def setup_admin():
    data = request.get_json(force=True)
    username = data.get("username")
    password = data.get("password")

    conn = get_conn()

    existing = conn.execute(
        "SELECT * FROM admins WHERE username=?",
        (username,)
    ).fetchone()

    if existing:
        return jsonify({"ok": False, "error": "Admin already exists"})

    password_hash = generate_password_hash(password)

    conn.execute(
        "INSERT INTO admins (username, password_hash) VALUES (?,?)",
        (username, password_hash)
    )
    conn.commit()
    conn.close()

    return jsonify({"ok": True, "message": "Admin created"})


# ---------------- SEND OTP ----------------
@auth_routes.post("/api/send-otp")
def send_otp():
    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"ok": False, "error": "Email required"}), 400

    otp = str(random.randint(100000, 999999))
    expires_at = _expires_str(0.1)

    conn = get_conn()
    conn.execute(
        "REPLACE INTO otps (phone, otp, expires_at) VALUES (?,?,?)",
        (email, otp, expires_at)
    )
    conn.commit()
    conn.close()

    print("OTP:", otp)

    send_email_otp(email, otp)

    return jsonify({"ok": True})


# ---------------- VERIFY OTP ----------------
@auth_routes.post("/api/verify-otp")
def verify_otp():
    data = request.get_json()
    email = data.get("email")
    otp = data.get("otp")

    conn = get_conn()
    row = conn.execute(
        "SELECT * FROM otps WHERE phone=?",
        (email,)
    ).fetchone()

    if not row:
        return jsonify({"ok": False, "error": "OTP not found"}), 400

    if row["otp"] != otp:
        return jsonify({"ok": False, "error": "Invalid OTP"}), 400

    conn.execute(
        "INSERT OR IGNORE INTO users (phone) VALUES (?)",
        (email,)
    )

    conn.commit()
    conn.close()

    # 🔥 CLEAN NAME LOGIC (YOUR CODE)
    name = email.split("@")[0]
    name = ''.join([c for c in name if not c.isdigit()])

    return jsonify({
        "ok": True,
        "user": {
            "name": name,
            "email": email
        }
    })


# ---------------- EMAIL OTP FUNCTION ----------------
def send_email_otp(to_email, otp):
    sender_email = "sandeepsuram2000@gmail.com"
    app_password = "uldocsmcxdzymwep"

    msg = MIMEText(f"Your OTP is: {otp}")
    msg["Subject"] = "Doggy Plaza OTP"
    msg["From"] = sender_email
    msg["To"] = to_email

    try:
        server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
        server.login(sender_email, app_password)
        server.send_message(msg)
        server.quit()
        print("✅ OTP sent successfully")
    except Exception as e:
        print("Email error:", e)