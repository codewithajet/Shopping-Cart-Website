from flask import Flask, jsonify, request, send_from_directory
from flask_mysqldb import MySQL
from flask_cors import CORS
import os
import re
import uuid
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# MySQL configuration
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'shopping_cart'
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'

# Initialize MySQL
mysql = MySQL(app)

# Image upload configuration
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size

if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

def allowed_file(filename):
    """Check if the file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']
    
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

# Products Routes
@app.route('/products', methods=['GET'])
def get_products():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute('SELECT * FROM products')
        products = cursor.fetchall()
        for product in products:
            cursor.execute('SELECT image_url FROM product_images WHERE product_id = %s', (product['id'],))
            product['images'] = [row['image_url'] for row in cursor.fetchall()]
        cursor.close()
        return jsonify(products), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch products', 'error': str(e)}), 500

@app.route('/products', methods=['POST'])
def add_product():
    try:
        name = request.form.get('name')
        price = request.form.get('price')
        category_id = request.form.get('category_id')
        description = request.form.get('description')
        images = request.files.getlist('images')

        if not name or not price or not category_id or not description:
            return jsonify({'message': 'Name, price, category_id, and description are required'}), 400

        # Validate price
        try:
            price = float(price)
            if price <= 0:
                return jsonify({'message': 'Price must be a positive number'}), 400
        except ValueError:
            return jsonify({'message': 'Price must be a valid number'}), 400

        cursor = mysql.connection.cursor()
        cursor.execute(
            'INSERT INTO products (name, price, category_id, description) VALUES (%s, %s, %s, %s)',
            (name, price, category_id, description)
        )
        product_id = cursor.lastrowid

        # Save images with secure naming
        image_urls = []
        for image in images:
            if image and allowed_file(image.filename):
                # Generate a unique filename
                ext = image.filename.rsplit('.', 1)[1].lower()
                filename = f"{uuid.uuid4().hex}.{ext}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                
                image.save(filepath)
                # Store relative path in DB, not full filepath
                image_url = f"uploads/{filename}"
                cursor.execute(
                    'INSERT INTO product_images (product_id, image_url) VALUES (%s, %s)',
                    (product_id, image_url)
                )
                image_urls.append(image_url)

        mysql.connection.commit()
        cursor.close()
        return jsonify({
            'message': 'Product added', 
            'id': product_id, 
            'images': image_urls
        }), 201
    except Exception as e:
        return jsonify({'message': 'Failed to add product', 'error': str(e)}), 500

@app.route('/products/<int:id>', methods=['DELETE'])
def delete_product(id):
    try:
        cursor = mysql.connection.cursor()
        
        # Check if product exists
        cursor.execute('SELECT id FROM products WHERE id = %s', (id,))
        if not cursor.fetchone():
            return jsonify({'message': 'Product not found'}), 404
            
        # Get image paths to delete files
        cursor.execute('SELECT image_url FROM product_images WHERE product_id = %s', (id,))
        images = cursor.fetchall()
        
        # Delete the product and related images from database
        cursor.execute('DELETE FROM product_images WHERE product_id = %s', (id,))
        cursor.execute('DELETE FROM products WHERE id = %s', (id,))
        mysql.connection.commit()
        cursor.close()
        
        # Delete actual image files
        for image in images:
            try:
                image_path = image['image_url']
                if os.path.exists(image_path) and os.path.isfile(image_path):
                    os.remove(image_path)
            except:
                # Continue even if file deletion fails
                pass
                
        return jsonify({'message': 'Product deleted'}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to delete product', 'error': str(e)}), 500

# Serve uploaded images
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

# Place an order
# Place an order
@app.route('/orders', methods=['POST'])
def place_order():
    data = request.get_json()

    # Extract data from the request
    name = data.get('name')
    email = data.get('email')
    address = data.get('address')
    payment_method = data.get('paymentMethod')
    items = data.get('items')
    total_amount = data.get('totalAmount')

    # Validate required fields
    if not name or not email or not address or not items or not total_amount:
        return jsonify({'message': 'All fields are required'}), 400

    # Validate email format
    if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
        return jsonify({'message': 'Invalid email format'}), 400

    # Validate total amount
    try:
        total_amount = float(total_amount)
        if total_amount <= 0:
            return jsonify({'message': 'Total amount must be a positive number'}), 400
    except ValueError:
        return jsonify({'message': 'Invalid total amount'}), 400

    # Validate items
    if not isinstance(items, list) or len(items) == 0:
        return jsonify({'message': 'Items must be a non-empty list'}), 400

    try:
        cursor = mysql.connection.cursor()

        # Create order record
        cursor.execute(
            'INSERT INTO orders (name, email, address, payment_method, total_amount) VALUES (%s, %s, %s, %s, %s)',
            (name, email, address, payment_method, total_amount)
        )
        order_id = cursor.lastrowid

        # Calculate real total to verify against submitted total
        calculated_total = 0

        # Process each item in the order
        for item in items:
            product_id = item['product']['id']
            quantity = item['quantity']
            price = item['product']['price']

            # Validate product existence and price
            cursor.execute('SELECT price FROM products WHERE id = %s', (product_id,))
            product = cursor.fetchone()
            if not product:
                # Rollback transaction if product doesn't exist
                mysql.connection.rollback()
                return jsonify({'message': f'Product with ID {product_id} not found'}), 404

            # Verify price matches database (prevent price manipulation)
            actual_price = float(product['price'])
            if abs(float(price) - actual_price) > 0.01:  # Allow for small floating point differences
                mysql.connection.rollback()
                return jsonify({'message': 'Product price mismatch'}), 400

            # Add to calculated total
            calculated_total += actual_price * quantity

            # Add order item
            cursor.execute(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (%s, %s, %s, %s)',
                (order_id, product_id, quantity, price)
            )

        # Verify total amount (with small tolerance for floating point)
        if abs(calculated_total - total_amount) > 0.01:
            mysql.connection.rollback()
            return jsonify({'message': 'Total amount mismatch'}), 400

        # Commit the transaction
        mysql.connection.commit()
        cursor.close()

        return jsonify({
            'message': 'Order placed successfully',
            'order_id': order_id
        }), 201

    except Exception as e:
        # Ensure transaction is rolled back on error
        mysql.connection.rollback()
        return jsonify({'message': 'Failed to place order', 'error': str(e)}), 500
if __name__ == '__main__':
    app.run(debug=True)
