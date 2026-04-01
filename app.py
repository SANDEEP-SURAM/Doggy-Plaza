from flask import Flask
from flask_cors import CORS

from routes.auth import auth_routes
from routes.products import product_routes
from routes.orders import order_routes
from db import init_db   # ✅ ADD THIS

app = Flask(__name__)
CORS(app)

init_db()   # ✅ VERY IMPORTANT
app.register_blueprint(auth_routes)
app.register_blueprint(product_routes)
app.register_blueprint(order_routes)

@app.route("/")
def home():
    return {"message": "Doggy Plaza API Running"}

if __name__ == "__main__":
    app.run(debug=True)