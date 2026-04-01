@auth_routes.post("/api/contact")
def contact():
    data = request.get_json()

    conn = get_conn()
    conn.execute(
        "INSERT INTO contacts (name, email, message) VALUES (?,?,?)",
        (data["name"], data["email"], data["message"])
    )
    conn.commit()
    conn.close()

    return jsonify({"ok": True})