from flask import Flask, jsonify, request, send_from_directory 
from flask_mysqldb import MySQL
from flask_cors import CORS
import os
import re
import uuid
import datetime
import random
import logging
import string
from decimal import Decimal
import json
import re
import secrets
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# MySQL configuration
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'shopping_cartdb'
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'

mysql = MySQL(app)

# Image upload configuration
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size

if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

    logging.basicConfig(level=logging.ERROR)

def allowed_file(filename):
    """Check if the file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

    # Helper Functions
def generate_order_number():
    """Generate a unique order number"""
    prefix = "ORD"
    timestamp = datetime.datetime.now().strftime("%Y%m%d")
    random_part = ''.join(random.choices(string.digits, k=6))
    return f"{prefix}-{timestamp}-{random_part}"

def calculate_discount(subtotal, coupon):
    """Calculate discount amount based on coupon"""
    if not coupon or not coupon['is_active']:
        return 0
    
    # Check if coupon is valid based on dates
    current_time = datetime.datetime.now()
    start_date = coupon['start_date']
    end_date = coupon['end_date']
    
    if current_time < start_date or current_time > end_date:
        return 0
        
    # Check minimum order value
    if Decimal(subtotal) < Decimal(coupon['min_order_value']):
        return 0
        
    # Calculate discount
    if coupon['discount_type'] == 'percentage':
        discount = Decimal(subtotal) * (Decimal(coupon['discount_value']) / 100)
        # Apply max discount if specified
        if coupon['max_discount'] and discount > Decimal(coupon['max_discount']):
            discount = Decimal(coupon['max_discount'])
    else:  # fixed discount
        discount = Decimal(coupon['discount_value'])
        # Ensure discount doesn't exceed order subtotal
        if discount > Decimal(subtotal):
            discount = Decimal(subtotal)
            
    return discount


# Routes
# Login Route
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Validate email format
    if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
        return jsonify({'message': 'Invalid email format'}), 400

    # Validate password length
    if len(password) < 6:
        return jsonify({'message': 'Password must be at least 6 characters long'}), 400

    # Check if user exists
    try:
        cursor = mysql.connection.cursor()
        cursor.execute(
            'SELECT id, password FROM users WHERE email = %s',
            (email,)
        )
        user = cursor.fetchone()
        cursor.close()

        # For debugging, you can print out the actual values:
        # print(f"User: {user}, Email: {email}, Password attempt: {password}")
        
        # The issue is likely that the stored password isn't a proper hash
        # or the password verification is failing
        if user:
            # We'll try a simple comparison first if the hash check is failing
            if user['password'] == password:
                return jsonify({'message': 'Login successful', 'user_id': user['id']}), 200
            # Also try the proper hash check as a fallback
            elif check_password_hash(user['password'], password):
                return jsonify({'message': 'Login successful', 'user_id': user['id']}), 200
        
        # If we got here, authentication failed
        return jsonify({'message': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'message': 'An error occurred. Please try again.', 'error': str(e)}), 500
    # Products Routes
# Get all products
@app.route('/products', methods=['GET'])
def get_products():
    try:
        cursor = mysql.connection.cursor()

        # Get query parameters for filtering
        category_id = request.args.get('category_id')
        min_price = request.args.get('min_price')
        max_price = request.args.get('max_price')

        # Base query
        query = 'SELECT * FROM products WHERE 1=1'
        params = []

        # Apply filters if provided
        if category_id:
            query += ' AND category_id = %s'
            params.append(int(category_id))

        if min_price:
            query += ' AND price >= %s'
            params.append(float(min_price))

        if max_price:
            query += ' AND price <= %s'
            params.append(float(max_price))

        # Execute the main query
        cursor.execute(query, params)
        products = cursor.fetchall()

        # Fetch images for each product
        for product in products:
            cursor.execute('SELECT image_url FROM product_images WHERE product_id = %s', (product['id'],))
            product['images'] = [row['image_url'] for row in cursor.fetchall()]

            # Get category name
            cursor.execute('SELECT name FROM categories WHERE id = %s', (product['category_id'],))
            category = cursor.fetchone()
            product['category_name'] = category['name'] if category else None

        cursor.close()
        return jsonify(products), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch products', 'error': str(e)}), 500
# Get a single product by ID
@app.route('/products/<int:id>', methods=['GET'])
def get_product(id):
    try:
        cursor = mysql.connection.cursor()
        cursor.execute('SELECT * FROM products WHERE id = %s', (id,))
        product = cursor.fetchone()

        if not product:
            return jsonify({'message': 'Product not found'}), 404

        # Get product images
        cursor.execute('SELECT image_url FROM product_images WHERE product_id = %s', (id,))
        product['images'] = [row['image_url'] for row in cursor.fetchall()]

        # Get category information
        cursor.execute('SELECT name FROM categories WHERE id = %s', (product['category_id'],))
        category = cursor.fetchone()
        product['category_name'] = category['name'] if category else None

        cursor.close()
        return jsonify(product), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch product', 'error': str(e)}), 500
# Add a new product
@app.route('/products', methods=['POST'])
def add_product():
    try:
        name = request.form.get('name')
        price = request.form.get('price')
        category_id = request.form.get('category_id')
        description = request.form.get('description')
        stock_quantity = request.form.get('stock_quantity', 0)
        images = request.files.getlist('images')
        # Validate required fields
        if not name or not price or not category_id or not description:
            return jsonify({'message': 'Name, price, category_id, and description are required'}), 400
        # Validate price
        try:
            price = float(price)
            if price <= 0:
                return jsonify({'message': 'Price must be a positive number'}), 400
        except ValueError:
            return jsonify({'message': 'Price must be a valid number'}), 400

        # Validate stock quantity
        try:
            stock_quantity = int(stock_quantity)
            if stock_quantity < 0:
                return jsonify({'message': 'Stock quantity cannot be negative'}), 400
        except ValueError:
            return jsonify({'message': 'Stock quantity must be a valid integer'}), 400

        # Validate category exists
        cursor = mysql.connection.cursor()
        cursor.execute('SELECT id FROM categories WHERE id = %s', (category_id,))
        if not cursor.fetchone():
            return jsonify({'message': 'Category not found'}), 400
        # Insert product
        cursor.execute(
            'INSERT INTO products (name, price, category_id, description, stock_quantity) VALUES (%s, %s, %s, %s, %s)',
            (name, price, category_id, description, stock_quantity)
        )
        product_id = cursor.lastrowid
        # Save images with secure naming
        image_urls = []
        for i, image in enumerate(images):
            if image and allowed_file(image.filename):
                # Generate a unique filename
                ext = image.filename.rsplit('.', 1)[1].lower()
                filename = f"{uuid.uuid4().hex}.{ext}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

                image.save(filepath)
                # Store relative path in DB
                image_url = f"/static/uploads/{filename}"
                is_primary = (i == 0)  # First image is primary
                cursor.execute(
                    'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (%s, %s, %s)',
                    (product_id, image_url, is_primary)
                )
                image_urls.append(image_url)
        mysql.connection.commit()
        cursor.close()
        return jsonify({
            'message': 'Product added successfully', 
            'id': product_id, 
            'images': image_urls
        }), 201
    except Exception as e:
        return jsonify({'message': 'Failed to add product', 'error': str(e)}), 500
# Update a product
# Database helper functions
def get_db_connection():
    # Using mysql.connection from Flask-MySQL
    return mysql.connection

def check_product_stock(product_id, requested_quantity):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get product and its current stock
        cursor.execute(
            "SELECT id, name, price, stock_quantity FROM products WHERE id = %s", 
            (product_id,)
        )
        product = cursor.fetchone()
        
        if not product:
            return {"available": False, "reason": "product_not_found", "name": f"Product #{product_id}"}
        
        # Check if requested quantity is available
        if product['stock_quantity'] < requested_quantity:
            return {
                "available": False, 
                "reason": "insufficient_stock",
                "name": product['name'],
                "requested": requested_quantity,
                "in_stock": product['stock_quantity']
            }
        
        return {"available": True, "product_id": product_id}
    except Exception as e:
        print(f"Database error: {e}")
        return {"available": False, "reason": "database_error"}
    finally:
        cursor.close()

@app.route('/products/check-stock', methods=['POST'])
def check_stock():
    try:
        data = request.get_json()
        
        if not data or 'items' not in data or not isinstance(data['items'], list):
            return jsonify({"success": False, "message": "Invalid request format"}), 400
        
        items = data['items']
        out_of_stock_items = []
        
        # Check each item's stock availability
        for item in items:
            product_id = item.get('productId')
            quantity = item.get('quantity', 1)
            
            if not product_id:
                return jsonify({"success": False, "message": "Product ID is required for each item"}), 400
            
            # Validate numeric values
            try:
                product_id = int(product_id)
                quantity = int(quantity)
                if quantity <= 0:
                    return jsonify({"success": False, "message": "Quantity must be a positive number"}), 400
            except ValueError:
                return jsonify({"success": False, "message": "Product ID and quantity must be valid numbers"}), 400
            
            stock_check = check_product_stock(product_id, quantity)
            
            if not stock_check["available"]:
                out_of_stock_items.append({
                    "id": product_id,
                    "name": stock_check.get("name", f"Product #{product_id}"),
                    "requested": quantity,
                    "available": stock_check.get("in_stock", 0),
                    "reason": stock_check.get("reason", "unknown")
                })
        
        # If any items are out of stock, return them in the response
        if out_of_stock_items:
            return jsonify({
                "success": False,
                "message": "Some items in your cart are out of stock",
                "outOfStockItems": out_of_stock_items
            }), 409
        
        # All items are in stock
        return jsonify({
            "success": True,
            "message": "All items are in stock"
        })
        
    except Exception as e:
        print(f"Error checking stock: {str(e)}")
        return jsonify({"success": False, "message": "An error occurred while checking stock"}), 500

# Optional: Create an endpoint to update stock quantity (for testing)
@app.route('/products/update-stock', methods=['POST'])
def update_stock():
    conn = None
    cursor = None
    try:
        data = request.get_json()
        
        if not data or 'productId' not in data or 'quantity' not in data:
            return jsonify({"success": False, "message": "Product ID and quantity are required"}), 400
        
        # Validate numeric values
        try:
            product_id = int(data['productId'])
            quantity = int(data['quantity'])
            if quantity < 0:
                return jsonify({"success": False, "message": "Quantity cannot be negative"}), 400
        except ValueError:
            return jsonify({"success": False, "message": "Product ID and quantity must be valid numbers"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # First check if product exists
        cursor.execute("SELECT id FROM products WHERE id = %s", (product_id,))
        if not cursor.fetchone():
            return jsonify({"success": False, "message": f"Product with ID {product_id} not found"}), 404
        
        # Update the stock quantity
        cursor.execute(
            "UPDATE products SET stock_quantity = %s WHERE id = %s", 
            (quantity, product_id)
        )
        
        conn.commit()
        
        return jsonify({
            "success": True,
            "message": f"Stock updated for product {product_id}"
        })
        
    except Exception as e:
        if conn:
            try:
                conn.rollback()
            except:
                pass
        print(f"Error updating stock: {str(e)}")
        return jsonify({"success": False, "message": f"An error occurred while updating stock: {str(e)}"}), 500
    finally:
        if cursor:
            cursor.close()

@app.route('/products/<int:id>', methods=['PUT', 'PATCH'])
def update_product(id):
    cursor = None
    try:
        cursor = mysql.connection.cursor()

        # Check if product exists
        cursor.execute('SELECT id FROM products WHERE id = %s', (id,))
        if not cursor.fetchone():
            return jsonify({'message': 'Product not found'}), 404

        # Get form data
        data = request.form

        # Build update query dynamically based on provided fields
        update_fields = []
        update_values = []

        if 'name' in data:
            update_fields.append('name = %s')
            update_values.append(data['name'])

        if 'description' in data:
            update_fields.append('description = %s')
            update_values.append(data['description'])

        if 'price' in data:
            try:
                price = float(data['price'])
                if price <= 0:
                    return jsonify({'message': 'Price must be a positive number'}), 400
                update_fields.append('price = %s')
                update_values.append(price)
            except ValueError:
                return jsonify({'message': 'Price must be a valid number'}), 400

        if 'stock_quantity' in data:
            try:
                stock = int(data['stock_quantity'])
                if stock < 0:
                    return jsonify({'message': 'Stock quantity cannot be negative'}), 400
                update_fields.append('stock_quantity = %s')
                update_values.append(stock)
            except ValueError:
                return jsonify({'message': 'Stock quantity must be a valid integer'}), 400

        if 'category_id' in data:
            # Validate category exists
            cursor.execute('SELECT id FROM categories WHERE id = %s', (data['category_id'],))
            if not cursor.fetchone():
                return jsonify({'message': 'Category not found'}), 400
            update_fields.append('category_id = %s')
            update_values.append(data['category_id'])

        # If no fields to update
        if not update_fields:
            return jsonify({'message': 'No fields to update provided'}), 400

        # Build and execute the update query
        query = f"UPDATE products SET {', '.join(update_fields)} WHERE id = %s"
        update_values.append(id)
        cursor.execute(query, update_values)

        # Handle new images if provided
        if 'images' in request.files:
            images = request.files.getlist('images')

            # Delete old images if replace_images flag is set
            if data.get('replace_images') == 'true':
                # Get existing image paths to delete files
                cursor.execute('SELECT image_url FROM product_images WHERE product_id = %s', (id,))
                old_images = cursor.fetchall()

                # Delete image records from DB
                cursor.execute('DELETE FROM product_images WHERE product_id = %s', (id,))

                # Delete physical files
                for image in old_images:
                    try:
                        file_path = os.path.join('static', image['image_url'].lstrip('/static/'))
                        if os.path.exists(file_path):
                            os.remove(file_path)
                    except Exception:
                        # Continue even if file deletion fails
                        pass

            # Add new images
            for i, image in enumerate(images):
                if image and allowed_file(image.filename):
                    ext = image.filename.rsplit('.', 1)[1].lower()
                    filename = f"{uuid.uuid4().hex}.{ext}"
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

                    image.save(filepath)
                    image_url = f"/static/uploads/{filename}"
                    is_primary = (i == 0 and data.get('replace_images') == 'true')
                    cursor.execute(
                        'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (%s, %s, %s)',
                        (id, image_url, is_primary)
                    )

        mysql.connection.commit()
        return jsonify({'message': 'Product updated successfully'}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to update product', 'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()

@app.route('/products/<int:id>', methods=['DELETE'])
def delete_product(id):
    cursor = None
    try:
        cursor = mysql.connection.cursor()

        # Check if product exists
        cursor.execute('SELECT id FROM products WHERE id = %s', (id,))
        if not cursor.fetchone():
            return jsonify({'message': 'Product not found'}), 404

        # Get image paths to delete files
        cursor.execute('SELECT image_url FROM product_images WHERE product_id = %s', (id,))
        images = cursor.fetchall()

        # Delete the product (product_images will be deleted automatically due to ON DELETE CASCADE)
        cursor.execute('DELETE FROM products WHERE id = %s', (id,))
        mysql.connection.commit()

        # Delete actual image files
        for image in images:
            try:
                file_path = os.path.join('static', image['image_url'].lstrip('/static/'))
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception:
                # Continue even if file deletion fails
                pass

        return jsonify({'message': 'Product deleted successfully'}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to delete product', 'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
# Category Management Routes
@app.route('/categories', methods=['GET'])
def get_categories():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute('SELECT * FROM categories')
        categories = cursor.fetchall()
        cursor.close()
        return jsonify(categories), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch categories', 'error': str(e)}), 500

@app.route('/categories', methods=['POST'])
def add_category():
    data = request.get_json()
    name = data.get('name')

    if not name:
        return jsonify({'message': 'Category name is required'}), 400

    try:
        cursor = mysql.connection.cursor()
        cursor.execute(
            'INSERT INTO categories (name) VALUES (%s)',
            (name,)
        )
        mysql.connection.commit()
        category_id = cursor.lastrowid
        cursor.close()
        return jsonify({'message': 'Category added', 'id': category_id}), 201
    except Exception as e:
        return jsonify({'message': 'Failed to add category', 'error': str(e)}), 500

@app.route('/categories/<int:id>', methods=['DELETE'])
def delete_category(id):
    try:
        cursor = mysql.connection.cursor()
        # Check if category exists
        cursor.execute('SELECT id FROM categories WHERE id = %s', (id,))
        if not cursor.fetchone():
            return jsonify({'message': 'Category not found'}), 404
        
        cursor.execute('DELETE FROM categories WHERE id = %s', (id,))
        mysql.connection.commit()
        cursor.close()
        return jsonify({'message': 'Category deleted'}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to delete category', 'error': str(e)}), 500
  
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# User Management Routes
@app.route('/users', methods=['GET'])
def get_users():
    try:
        cursor = mysql.connection.cursor()
        # Don't return password hashes in the API response
        cursor.execute('SELECT id, username, email FROM users')
        users = cursor.fetchall()
        cursor.close()
        return jsonify(users), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch users', 'error': str(e)}), 500

@app.route('/users', methods=['POST'])
def add_user():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'message': 'Username, email, and password are required'}), 400

    # Validate email format
    if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
        return jsonify({'message': 'Invalid email format'}), 400
        
    # Validate password strength
    if len(password) < 6:
        return jsonify({'message': 'Password must be at least 6 characters long'}), 400

    try:
        cursor = mysql.connection.cursor()
        
        # Check if email already exists
        cursor.execute('SELECT id FROM users WHERE email = %s', (email,))
        if cursor.fetchone():
            return jsonify({'message': 'Email already in use'}), 400
            
        # Hash the password
        hashed_password = generate_password_hash(password)
        
        cursor.execute(
            'INSERT INTO users (username, email, password) VALUES (%s, %s, %s)',
            (username, email, hashed_password)
        )
        mysql.connection.commit()
        user_id = cursor.lastrowid
        cursor.close()
        return jsonify({'message': 'User added', 'id': user_id}), 201
    except Exception as e:
        return jsonify({'message': 'Failed to add user', 'error': str(e)}), 500

@app.route('/users/<int:id>', methods=['DELETE'])
def delete_user(id):
    try:
        cursor = mysql.connection.cursor()
        # Check if user exists
        cursor.execute('SELECT id FROM users WHERE id = %s', (id,))
        if not cursor.fetchone():
            return jsonify({'message': 'User not found'}), 404
            
        cursor.execute('DELETE FROM users WHERE id = %s', (id,))
        mysql.connection.commit()
        cursor.close()
        return jsonify({'message': 'User deleted'}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to delete user', 'error': str(e)}), 500

# Get all roles
@app.route('/roles', methods=['GET'])
def get_roles():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute('SELECT * FROM roles')
        roles = cursor.fetchall()
        cursor.close()
        return jsonify(roles), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch roles', 'error': str(e)}), 500

# Add a new role
@app.route('/roles', methods=['POST'])
def add_role():
    data = request.get_json()
    name = data.get('name')
    description = data.get('description')

    if not name or not description:
        return jsonify({'message': 'Name and description are required'}), 400

    try:
        cursor = mysql.connection.cursor()
        cursor.execute(
            'INSERT INTO roles (name, description) VALUES (%s, %s)',
            (name, description)
        )
        mysql.connection.commit()
        role_id = cursor.lastrowid
        cursor.close()
        return jsonify({'message': 'Role added', 'id': role_id}), 201
    except Exception as e:
        return jsonify({'message': 'Failed to add role', 'error': str(e)}), 500

# Delete a role
@app.route('/roles/<int:id>', methods=['DELETE'])
def delete_role(id):
    try:
        cursor = mysql.connection.cursor()
        cursor.execute('DELETE FROM roles WHERE id = %s', (id,))
        mysql.connection.commit()
        cursor.close()
        return jsonify({'message': 'Role deleted'}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to delete role', 'error': str(e)}), 500

# Get all sales
@app.route('/sales', methods=['GET'])
def get_sales():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute('SELECT * FROM sales')
        sales = cursor.fetchall()
        cursor.close()
        return jsonify(sales), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch sales', 'error': str(e)}), 500

# Add a new sale
@app.route('/sales', methods=['POST'])
def add_sale():
    data = request.get_json()
    product_id = data.get('product_id')
    quantity = data.get('quantity')
    total_price = data.get('total_price')

    if not product_id or not quantity or not total_price:
        return jsonify({'message': 'Product ID, quantity, and total price are required'}), 400

    try:
        cursor = mysql.connection.cursor()
        cursor.execute(
            'INSERT INTO sales (product_id, quantity, total_price) VALUES (%s, %s, %s)',
            (product_id, quantity, total_price)
        )
        mysql.connection.commit()
        sale_id = cursor.lastrowid
        cursor.close()
        return jsonify({'message': 'Sale added', 'id': sale_id}), 201
    except Exception as e:
        return jsonify({'message': 'Failed to add sale', 'error': str(e)}), 500

# Delete a sale
@app.route('/sales/<int:id>', methods=['DELETE'])
def delete_sale(id):
    try:
        cursor = mysql.connection.cursor()
        cursor.execute('DELETE FROM sales WHERE id = %s', (id,))
        mysql.connection.commit()
        cursor.close()
        return jsonify({'message': 'Sale deleted'}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to delete sale', 'error': str(e)}), 500


# Coupon Management API
@app.route('/coupons', methods=['GET'])
def get_coupons():
    try:
        cursor = mysql.connection.cursor()
        
        # Get query parameters for filtering
        is_active = request.args.get('is_active')
        current_date = request.args.get('current_date', datetime.datetime.now().strftime("%Y-%m-%d"))
        
        # Base query
        query = 'SELECT * FROM coupons WHERE 1=1'
        params = []
        
        # Apply filters if provided
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            query += ' AND is_active = %s'
            params.append(is_active_bool)
        
        if current_date:
            query += ' AND start_date <= %s AND end_date >= %s'
            params.extend([current_date, current_date])
        
        # Execute query
        cursor.execute(query, params)
        coupons = cursor.fetchall()
        cursor.close()
        
        return jsonify(coupons), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch coupons', 'error': str(e)}), 500

@app.route('/coupons/<string:code>', methods=['GET'])
def get_coupon_by_code(code):
    try:
        cursor = mysql.connection.cursor()
        cursor.execute('SELECT * FROM coupons WHERE code = %s', (code,))
        coupon = cursor.fetchone()
        cursor.close()
        
        if not coupon:
            return jsonify({'message': 'Coupon not found'}), 404
            
        return jsonify(coupon), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch coupon', 'error': str(e)}), 500

@app.route('/coupons', methods=['POST'])
def create_coupon():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['code', 'discount_type', 'discount_value', 'start_date', 'end_date']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'{field} is required'}), 400
                
        # Validate discount_type
        if data['discount_type'] not in ['percentage', 'fixed']:
            return jsonify({'message': 'discount_type must be either "percentage" or "fixed"'}), 400
            
        # Validate discount_value
        try:
            discount_value = float(data['discount_value'])
            if discount_value <= 0:
                return jsonify({'message': 'discount_value must be positive'}), 400
                
            # Additional validation for percentage discount
            if data['discount_type'] == 'percentage' and discount_value > 100:
                return jsonify({'message': 'percentage discount cannot exceed 100%'}), 400
        except ValueError:
            return jsonify({'message': 'discount_value must be a valid number'}), 400
            
        # Parse dates
        try:
            start_date = datetime.datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
            end_date = datetime.datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
            
            if end_date <= start_date:
                return jsonify({'message': 'end_date must be after start_date'}), 400
        except ValueError:
            return jsonify({'message': 'Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)'}), 400
            
        # Set default values if not provided
        description = data.get('description', '')
        min_order_value = data.get('min_order_value', 0)
        max_discount = data.get('max_discount')
        is_active = data.get('is_active', True)
        
        cursor = mysql.connection.cursor()
        
        # Check if coupon code already exists
        cursor.execute('SELECT id FROM coupons WHERE code = %s', (data['code'],))
        if cursor.fetchone():
            return jsonify({'message': 'Coupon code already exists'}), 400
            
        # Insert the coupon
        cursor.execute('''
            INSERT INTO coupons (
                code, description, discount_type, discount_value, min_order_value,
                max_discount, is_active, start_date, end_date
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (
            data['code'], description, data['discount_type'], discount_value,
            min_order_value, max_discount, is_active, start_date, end_date
        ))
        
        coupon_id = cursor.lastrowid
        mysql.connection.commit()
        cursor.close()
        
        return jsonify({
            'message': 'Coupon created successfully',
            'id': coupon_id
        }), 201
    except Exception as e:
        return jsonify({'message': 'Failed to create coupon', 'error': str(e)}), 500

@app.route('/coupons/<int:id>', methods=['PUT', 'PATCH'])
def update_coupon(id):
    try:
        data = request.get_json()
        cursor = mysql.connection.cursor()
        
        # Check if coupon exists
        cursor.execute('SELECT * FROM coupons WHERE id = %s', (id,))
        coupon = cursor.fetchone()
        if not coupon:
            return jsonify({'message': 'Coupon not found'}), 404
            
        # Build update query
        update_fields = []
        update_values = []
        
        # Handle each updatable field
        if 'code' in data:
            # Check if the new code already exists (except for this coupon)
            cursor.execute('SELECT id FROM coupons WHERE code = %s AND id != %s', (data['code'], id))
            if cursor.fetchone():
                return jsonify({'message': 'Coupon code already exists'}), 400
                
            update_fields.append('code = %s')
            update_values.append(data['code'])
            
        if 'description' in data:
            update_fields.append('description = %s')
            update_values.append(data['description'])
            
        if 'discount_type' in data:
            if data['discount_type'] not in ['percentage', 'fixed']:
                return jsonify({'message': 'discount_type must be either "percentage" or "fixed"'}), 400
                
            update_fields.append('discount_type = %s')
            update_values.append(data['discount_type'])
            
        if 'discount_value' in data:
            try:
                discount_value = float(data['discount_value'])
                if discount_value <= 0:
                    return jsonify({'message': 'discount_value must be positive'}), 400
                    
                # Check percentage constraint if applicable
                discount_type = data.get('discount_type', coupon['discount_type'])
                if discount_type == 'percentage' and discount_value > 100:
                    return jsonify({'message': 'percentage discount cannot exceed 100%'}), 400
                    
                update_fields.append('discount_value = %s')
                update_values.append(discount_value)
            except ValueError:
                return jsonify({'message': 'discount_value must be a valid number'}), 400
                
        if 'min_order_value' in data:
            try:
                min_value = float(data['min_order_value'])
                if min_value < 0:
                    return jsonify({'message': 'min_order_value cannot be negative'}), 400
                    
                update_fields.append('min_order_value = %s')
                update_values.append(min_value)
            except ValueError:
                return jsonify({'message': 'min_order_value must be a valid number'}), 400
                
        if 'max_discount' in data:
            if data['max_discount'] is not None:
                try:
                    max_discount = float(data['max_discount'])
                    if max_discount <= 0:
                        return jsonify({'message': 'max_discount must be positive'}), 400
                        
                    update_fields.append('max_discount = %s')
                    update_values.append(max_discount)
                except ValueError:
                    return jsonify({'message': 'max_discount must be a valid number'}), 400
            else:
                update_fields.append('max_discount = NULL')
                
        if 'is_active' in data:
            update_fields.append('is_active = %s')
            update_values.append(bool(data['is_active']))
            
        if 'start_date' in data:
            try:
                start_date = datetime.datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
                
                # Check date constraints if end_date is also being updated
                if 'end_date' in data:
                    end_date = datetime.datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
                    if end_date <= start_date:
                        return jsonify({'message': 'end_date must be after start_date'}), 400
                else:
                    # Check against existing end_date
                    if start_date >= coupon['end_date']:
                        return jsonify({'message': 'start_date must be before end_date'}), 400
                        
                update_fields.append('start_date = %s')
                update_values.append(start_date)
            except ValueError:
                return jsonify({'message': 'Invalid start_date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)'}), 400
                
        if 'end_date' in data:
            try:
                end_date = datetime.datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
                
                # Check date constraints if start_date is also being updated
                if 'start_date' in data:
                    start_date = datetime.datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
                else:
                    # Check against existing start_date
                    if end_date <= coupon['start_date']:
                        return jsonify({'message': 'end_date must be after start_date'}), 400
                        
                update_fields.append('end_date = %s')
                update_values.append(end_date)
            except ValueError:
                return jsonify({'message': 'Invalid end_date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)'}), 400
                
        # If no fields to update
        if not update_fields:
            return jsonify({'message': 'No fields to update provided'}), 400
            
        # Build and execute update query
        query = f"UPDATE coupons SET {', '.join(update_fields)} WHERE id = %s"
        update_values.append(id)
        cursor.execute(query, update_values)
        
        mysql.connection.commit()
        cursor.close()
        
        return jsonify({'message': 'Coupon updated successfully'}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to update coupon', 'error': str(e)}), 500

@app.route('/coupons/<int:id>', methods=['DELETE'])
def delete_coupon(id):
    try:
        cursor = mysql.connection.cursor()
        
        # Check if coupon exists
        cursor.execute('SELECT id FROM coupons WHERE id = %s', (id,))
        if not cursor.fetchone():
            return jsonify({'message': 'Coupon not found'}), 404
            
        # Check if coupon is being used in any orders
        cursor.execute('SELECT id FROM orders WHERE coupon_id = %s LIMIT 1', (id,))
        if cursor.fetchone():
            # Instead of deleting, deactivate the coupon
            cursor.execute('UPDATE coupons SET is_active = FALSE WHERE id = %s', (id,))
            mysql.connection.commit()
            cursor.close()
            return jsonify({
                'message': 'Coupon is in use by existing orders. It has been deactivated instead of deleted.'
            }), 200
            
        # Delete the coupon
        cursor.execute('DELETE FROM coupons WHERE id = %s', (id,))
        mysql.connection.commit()
        cursor.close()
        
        return jsonify({'message': 'Coupon deleted successfully'}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to delete coupon', 'error': str(e)}), 500

# Validate coupon API endpoint
@app.route('/coupons/validate', methods=['POST'])
def validate_coupon():
    try:
        data = request.get_json()
        
        # Required fields
        if 'code' not in data:
            return jsonify({'message': 'Coupon code is required'}), 400
            
        subtotal = data.get('subtotal', 0)
        try:
            subtotal = float(subtotal)
        except ValueError:
            return jsonify({'message': 'Subtotal must be a valid number'}), 400
            
        cursor = mysql.connection.cursor()
        cursor.execute('SELECT * FROM coupons WHERE code = %s', (data['code'],))
        coupon = cursor.fetchone()
        cursor.close()
        
        if not coupon:
            return jsonify({
                'valid': False,
                'message': 'Invalid coupon code'
            }), 200
            
        # Check if coupon is active
        if not coupon['is_active']:
            return jsonify({
                'valid': False,
                'message': 'Coupon is not active'
            }), 200
            
        # Check date validity
        current_time = datetime.datetime.now()
        if current_time < coupon['start_date'] or current_time > coupon['end_date']:
            return jsonify({
                'valid': False,
                'message': 'Coupon is expired or not yet active'
            }), 200
            
        # Check minimum order value
        if subtotal < float(coupon['min_order_value']):
            return jsonify({
                'valid': False,
                'message': f"Minimum order value of ${coupon['min_order_value']} not met"
            }), 200
            
        # Calculate discount
        discount = calculate_discount(subtotal, coupon)
        
        return jsonify({
            'valid': True,
            'coupon': {
                'id': coupon['id'],
                'code': coupon['code'],
                'discount_type': coupon['discount_type'],
                'discount_value': float(coupon['discount_value']),
                'min_order_value': float(coupon['min_order_value']),
                'max_discount': float(coupon['max_discount']) if coupon['max_discount'] else None
            },
            'discount_amount': float(discount),
            'message': 'Coupon is valid'
        }), 200
    except Exception as e:
        return jsonify({'message': 'Failed to validate coupon', 'error': str(e)}), 500

# Order Management API
def generate_order_number():
    """Generate a unique order number"""
    timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
    return f"ORD-{timestamp}"

def calculate_discount(subtotal, coupon):
    """Calculate discount amount based on coupon"""
    discount_amount = 0
    
    if coupon['discount_type'] == 'percentage':
        discount_amount = subtotal * (float(coupon['discount_value']) / 100)
    elif coupon['discount_type'] == 'fixed':
        discount_amount = float(coupon['discount_value'])
        
    # Don't allow discount to exceed order value
    return min(discount_amount, subtotal)

# Order Management API
@app.route('/orders', methods=['GET'])
def get_orders():
    try:
        cursor = mysql.connection.cursor()
        
        # Get query parameters for filtering
        status = request.args.get('status')
        customer_email = request.args.get('customer_email')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Base query
        query = 'SELECT * FROM orders WHERE 1=1'
        params = []
        
        # Apply filters if provided
        if status:
            query += ' AND order_status = %s'
            params.append(status)
            
        if customer_email:
            query += ' AND customer_email = %s'
            params.append(customer_email)
            
        if date_from:
            query += ' AND created_at >= %s'
            params.append(date_from)
            
        if date_to:
            query += ' AND created_at <= %s'
            params.append(date_to)
            
        # Add sorting
        query += ' ORDER BY created_at DESC'
        
        # Execute query
        cursor.execute(query, tuple(params))
        orders = cursor.fetchall()
        
        # Get order items for each order
        for order in orders:
            cursor.execute('SELECT * FROM order_items WHERE order_id = %s', (order['id'],))
            order['items'] = cursor.fetchall()
            
            # Parse JSON attributes
            for item in order['items']:
                if item['attributes']:
                    item['attributes'] = json.loads(item['attributes'])
                    
            # Get payment information
            cursor.execute('SELECT * FROM payments WHERE order_id = %s', (order['id'],))
            order['payments'] = cursor.fetchall()
            
            # Get coupon details if used
            if order['coupon_id']:
                cursor.execute('SELECT code, discount_type, discount_value FROM coupons WHERE id = %s', (order['coupon_id'],))
                order['coupon'] = cursor.fetchone()
        
        return jsonify(orders), 200
    except Exception as e:
        # Log the error
        app.logger.error(f"Error fetching orders: {str(e)}")
        return jsonify({'message': 'Failed to fetch orders', 'error': str(e)}), 500

@app.route('/orders/<string:order_number>', methods=['GET'])
def get_order_by_number(order_number):
    try:
        cursor = mysql.connection.cursor()
        
        # Get order details
        cursor.execute('SELECT * FROM orders WHERE order_number = %s', (order_number,))
        order = cursor.fetchone()
        
        if not order:
            return jsonify({'message': 'Order not found'}), 404
            
        # Get order items
        cursor.execute('SELECT * FROM order_items WHERE order_id = %s', (order['id'],))
        order['items'] = cursor.fetchall()
        
        # Parse JSON attributes
        for item in order['items']:
            if item['attributes']:
                item['attributes'] = json.loads(item['attributes'])
                
        # Get payment information
        cursor.execute('SELECT * FROM payments WHERE order_id = %s', (order['id'],))
        order['payments'] = cursor.fetchall()
        
        # Get coupon details if used
        if order['coupon_id']:
            cursor.execute('SELECT code, discount_type, discount_value FROM coupons WHERE id = %s', (order['coupon_id'],))
            order['coupon'] = cursor.fetchone()
            
        return jsonify(order), 200
    except Exception as e:
        app.logger.error(f"Error fetching order {order_number}: {str(e)}")
        return jsonify({'message': 'Failed to fetch order', 'error': str(e)}), 500

@app.route('/orders', methods=['POST'])
def create_order():
    conn = None
    cursor = None
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = [
            'customer_name', 'customer_email', 'shipping_address', 'shipping_city', 
            'shipping_state', 'shipping_country', 'shipping_zip_code', 'delivery_method',
            'subtotal', 'shipping_cost', 'tax_amount', 'payment_method', 'items'
        ]
        
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'{field} is required'}), 400
                
        # Validate items
        if not isinstance(data['items'], list) or len(data['items']) == 0:
            return jsonify({'message': 'At least one item is required'}), 400
            
        for item in data['items']:
            if 'product_id' not in item or 'quantity' not in item or 'unit_price' not in item:
                return jsonify({'message': 'Each item must have product_id, quantity, and unit_price'}), 400
                
            # Validate numeric values
            try:
                if int(item['quantity']) <= 0:
                    return jsonify({'message': 'Item quantity must be positive'}), 400
                    
                if float(item['unit_price']) < 0:
                    return jsonify({'message': 'Item price cannot be negative'}), 400
            except ValueError:
                return jsonify({'message': 'Invalid quantity or price format'}), 400
                
        # Validate numeric values
        try:
            subtotal = float(data['subtotal'])
            shipping_cost = float(data['shipping_cost'])
            tax_amount = float(data['tax_amount'])
            
            if subtotal < 0 or shipping_cost < 0 or tax_amount < 0:
                return jsonify({'message': 'Price values cannot be negative'}), 400
        except ValueError:
            return jsonify({'message': 'Invalid price format'}), 400

        # Get a cursor - use with connection pooling
        conn = mysql.connection
        cursor = conn.cursor()
        
        # Check coupon if provided
        coupon_id = None
        discount_amount = 0
        
        if 'coupon_code' in data and data['coupon_code']:
            cursor.execute('SELECT * FROM coupons WHERE code = %s', (data['coupon_code'],))
            coupon = cursor.fetchone()
            
            if not coupon:
                return jsonify({'message': 'Invalid coupon code'}), 400
                
            # Validate coupon
            if not coupon['is_active']:
                return jsonify({'message': 'Coupon is not active'}), 400
                
            current_time = datetime.datetime.now()
            if current_time < coupon['start_date'] or current_time > coupon['end_date']:
                return jsonify({'message': 'Coupon is expired or not yet active'}), 400
                
            if subtotal < float(coupon['min_order_value']):
                return jsonify({'message': f"Minimum order value of ${coupon['min_order_value']} not met"}), 400
                
            # Calculate discount
            discount_amount = calculate_discount(subtotal, coupon)
            coupon_id = coupon['id']
            
        # Calculate total amount
        total_amount = subtotal + shipping_cost + tax_amount - discount_amount
        
        # Generate unique order number
        order_number = generate_order_number()
        
        # Create order
        cursor.execute('''
            INSERT INTO orders (
                order_number, customer_name, customer_email, customer_phone, shipping_address,
                shipping_city, shipping_state, shipping_country, shipping_zip_code,
                delivery_method, delivery_instructions, is_gift, gift_message,
                subtotal, shipping_cost, tax_amount, discount_amount, total_amount,
                payment_method, payment_status, coupon_id, order_status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (
            order_number, data['customer_name'], data['customer_email'], data.get('customer_phone'),
            data['shipping_address'], data['shipping_city'], data['shipping_state'],
            data['shipping_country'], data['shipping_zip_code'], data['delivery_method'],
            data.get('delivery_instructions'), data.get('is_gift', False), data.get('gift_message'),
            subtotal, shipping_cost, tax_amount, discount_amount, total_amount,
            data['payment_method'], 'pending', coupon_id, 'pending'
        ))
        
        order_id = cursor.lastrowid
        
        # Add order items
        for item in data['items']:
            # Prepare attributes as JSON if provided
            attributes_json = None
            if 'attributes' in item and item['attributes']:
                attributes_json = json.dumps(item['attributes'])
                
            # Calculate total price for item
            total_price = float(item['unit_price']) * int(item['quantity'])
            
            cursor.execute('''
                INSERT INTO order_items (
                    order_id, product_id, quantity, unit_price, total_price, attributes
                ) VALUES (%s, %s, %s, %s, %s, %s)
            ''', (
                order_id, item['product_id'], item['quantity'], 
                item['unit_price'], total_price, attributes_json
            ))
            
            # Update product stock quantity
            cursor.execute('''
                UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - %s)
                WHERE id = %s
            ''', (item['quantity'], item['product_id']))
            
        # Create initial payment record
        payment_status = 'pending'
        transaction_id = data.get('transaction_id')
        
        cursor.execute('''
            INSERT INTO payments (
                order_id, amount, payment_method, transaction_id, status
            ) VALUES (%s, %s, %s, %s, %s)
        ''', (
            order_id, total_amount, data['payment_method'], transaction_id, payment_status
        ))
        
        # Commit changes
        conn.commit()
        
        # Prepare response data
        response_data = {
            'message': 'Order created successfully',
            'order_id': order_id,
            'order_number': order_number,
            'total_amount': float(total_amount)
        }
        
        # Return successful response
        return jsonify(response_data), 201
        
    except Exception as e:
        # Log the error
        app.logger.error(f"Error creating order: {str(e)}")
        
        # Rollback transaction if there's an error
        if conn:
            try:
                conn.rollback()
            except Exception as rollback_error:
                app.logger.error(f"Error during rollback: {str(rollback_error)}")
            
        return jsonify({'message': 'Failed to create order', 'error': str(e)}), 500

@app.route('/orders/<string:order_number>/status', methods=['PATCH'])
def update_order_status(order_number):
    conn = None
    try:
        data = request.get_json()
        
        if 'status' not in data:
            return jsonify({'message': 'Order status is required'}), 400
            
        new_status = data['status']
        valid_statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
        
        if new_status not in valid_statuses:
            return jsonify({'message': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
            
        conn = mysql.connection
        cursor = conn.cursor()
        
        # Check if order exists
        cursor.execute('SELECT id FROM orders WHERE order_number = %s', (order_number,))
        order = cursor.fetchone()
        
        if not order:
            return jsonify({'message': 'Order not found'}), 404
            
        # Update order status
        cursor.execute('UPDATE orders SET order_status = %s WHERE id = %s', (new_status, order['id']))
        conn.commit()
        
        return jsonify({'message': 'Order status updated successfully'}), 200
    except Exception as e:
        app.logger.error(f"Error updating order status for {order_number}: {str(e)}")
        if conn:
            try:
                conn.rollback()
            except Exception as rollback_error:
                app.logger.error(f"Error during rollback: {str(rollback_error)}")
        return jsonify({'message': 'Failed to update order status', 'error': str(e)}), 500

@app.route('/orders/<string:order_number>/payment', methods=['POST'])
def update_payment(order_number):
    conn = None
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['amount', 'payment_method', 'status']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'{field} is required'}), 400
                
        # Validate amount
        try:
            amount = float(data['amount'])
            if amount <= 0:
                return jsonify({'message': 'Payment amount must be positive'}), 400
        except ValueError:
            return jsonify({'message': 'Invalid amount format'}), 400
            
        # Validate status
        valid_statuses = ['pending', 'completed', 'failed', 'refunded']
        if data['status'] not in valid_statuses:
            return jsonify({'message': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
            
        conn = mysql.connection
        cursor = conn.cursor()
        
        # Check if order exists
        cursor.execute('SELECT id, total_amount FROM orders WHERE order_number = %s', (order_number,))
        order = cursor.fetchone()
        
        if not order:
            return jsonify({'message': 'Order not found'}), 404
            
        # Create payment record
        cursor.execute('''
            INSERT INTO payments (
                order_id, amount, payment_method, transaction_id, status
            ) VALUES (%s, %s, %s, %s, %s)
        ''', (
            order['id'], amount, data['payment_method'], 
            data.get('transaction_id'), data['status']
        ))
        
        # Update order payment status
        payment_status = data['status']
        if payment_status == 'completed':
            # Check if total paid amount matches order total
            cursor.execute('''
                SELECT SUM(amount) as total_paid FROM payments 
                WHERE order_id = %s AND status = 'completed'
            ''', (order['id'],))
            
            result = cursor.fetchone()
            total_paid = float(result['total_paid'] or 0) + amount
            
            if total_paid >= float(order['total_amount']):
                payment_status = 'paid'
            else:
                payment_status = 'partially_paid'
        elif payment_status == 'refunded':
            payment_status = 'refunded'
            
        cursor.execute('UPDATE orders SET payment_status = %s WHERE id = %s', (payment_status, order['id']))
        
        conn.commit()
        
        return jsonify({'message': 'Payment updated successfully'}), 200
        
    except Exception as e:
        app.logger.error(f"Error updating payment for order {order_number}: {str(e)}")
        if conn:
            try:
                conn.rollback()
            except Exception as rollback_error:
                app.logger.error(f"Error during rollback: {str(rollback_error)}")
        return jsonify({'message': 'Failed to update payment', 'error': str(e)}), 500

# Add CORS support
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS')
    return response

# Handle OPTIONS requests for CORS preflight
@app.route('/orders', methods=['OPTIONS'])
@app.route('/orders/<string:order_number>', methods=['OPTIONS'])
@app.route('/orders/<string:order_number>/status', methods=['OPTIONS'])
@app.route('/orders/<string:order_number>/payment', methods=['OPTIONS'])
def handle_options_request(order_number=None):
    return jsonify({}), 200

if __name__ == '__main__':
    app.run(debug=True)
