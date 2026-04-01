from flask import Blueprint, jsonify

product_routes = Blueprint('products', __name__)

PRODUCTS = [
    {"id": 1, "name": "Dog Food Premium", "price": 399, "category": "dogfood"},
    {"id": 2, "name": "Chew Toy", "price": 199, "category": "toys"},
    {"id": 3, "name": "Dog Collar", "price": 149, "category": "accessories"},
]

@product_routes.get("/api/products")
def get_products():
    return jsonify(PRODUCTS)