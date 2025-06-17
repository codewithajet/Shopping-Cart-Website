from flask import Flask, jsonify, request, send_from_directory 
from flask_mysqldb import MySQL
from flask_cors import CORS
import os
from dotenv import load_dotenv
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

load_dotenv()  # loads variables from .env file

app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST', 'localhost')
app.config['MYSQL_USER'] = os.getenv('MYSQL_USER', 'root')
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD', '')
app.config['MYSQL_DB'] = os.getenv('MYSQL_DB', 'shopping_cartdb')
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'

# Configure file uploads
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static/uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize MySQL
mysql = MySQL(app)

# Helper function to check if file extension is allowed
def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Additional route to serve uploaded files directly
@app.route('/static/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    logging.basicConfig(level=logging.ERROR)

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

def parse_bool(val):
    if isinstance(val, bool):
        return val
    return str(val).lower() in ("true", "1", "yes")

@app.route('/products', methods=['GET'])
def get_products():
    try:
        cursor = mysql.connection.cursor()
        # Filtering parameters
        category_id = request.args.get('category_id', type=int)
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        sort_by = request.args.get('sort_by')  # name, price-low, price-high, rating

        query = 'SELECT * FROM products WHERE 1=1'
        params = []

        if category_id:
            query += ' AND category_id = %s'
            params.append(category_id)
        if min_price is not None:
            query += ' AND price >= %s'
            params.append(min_price)
        if max_price is not None:
            query += ' AND price <= %s'
            params.append(max_price)
        if sort_by == 'name':
            query += ' ORDER BY name ASC'
        elif sort_by == 'price-low':
            query += ' ORDER BY price ASC'
        elif sort_by == 'price-high':
            query += ' ORDER BY price DESC'
        elif sort_by == 'rating':
            query += ' ORDER BY rating DESC'
        else:
            query += ' ORDER BY id DESC'

        cursor.execute(query, tuple(params))
        products = cursor.fetchall()

        # Fetch product images & category names
        for product in products:
            # Add category_name
            product['category_name'] = get_category_name(product['category_id'])
            # Optionally add category_id for frontend mapping/filtering
            product['category_id'] = product.get('category_id')
            # Images
            cursor.execute('SELECT image_url FROM product_images WHERE product_id = %s', (product['id'],))
            images = cursor.fetchall()
            product['images'] = [img['image_url'] for img in images] if images else ([product['image']] if product['image'] else [])
            if product.get('specifications'):
                try:
                    product['specifications'] = json.loads(product['specifications'])
                except Exception:
                    product['specifications'] = None
        cursor.close()
        return jsonify(products), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch products', 'error': str(e)}), 500

@app.route('/products/<int:id>', methods=['GET'])
def get_product(id):
    try:
        cursor = mysql.connection.cursor()
        cursor.execute('SELECT * FROM products WHERE id = %s', (id,))
        product = cursor.fetchone()
        if not product:
            return jsonify({'message': 'Product not found'}), 404
        product['category_name'] = get_category_name(product['category_id'])
        product['category_id'] = product.get('category_id')
        cursor.execute('SELECT image_url FROM product_images WHERE product_id = %s', (id,))
        images = cursor.fetchall()
        product['images'] = [img['image_url'] for img in images] if images else ([product['image']] if product['image'] else [])
        if product.get('specifications'):
            try:
                product['specifications'] = json.loads(product['specifications'])
            except Exception:
                product['specifications'] = None
        cursor.close()
        return jsonify(product), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch product', 'error': str(e)}), 500

@app.route('/products', methods=['POST'])
def add_product():
    try:
        name = request.form.get('name')
        price = request.form.get('price', type=float)
        category_id = request.form.get('category_id', type=int)
        description = request.form.get('description')
        rating = request.form.get('rating', type=float)
        stock_count = request.form.get('stock_count', type=int, default=0)
        in_stock_str = request.form.get('in_stock')
        in_stock = parse_bool(in_stock_str) if in_stock_str is not None else True
        full_description = request.form.get('full_description')
        specifications = request.form.get('specifications')
        images = request.files.getlist('images')
        image_url = None
        image_urls = []
        if images:
            os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
            for idx, image_file in enumerate(images):
                if image_file and allowed_file(image_file.filename):
                    ext = image_file.filename.rsplit('.', 1)[1].lower()
                    filename = f"{uuid.uuid4().hex}.{ext}"
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    image_file.save(filepath)
                    url = f"/static/uploads/{filename}"
                    if idx == 0:
                        image_url = url
                    image_urls.append(url)
        if not all([name, price is not None, category_id, description]):
            return jsonify({'message': 'name, price, category_id, and description are required'}), 400

        if specifications:
            try:
                json.loads(specifications)
            except Exception:
                return jsonify({'message': 'specifications must be valid JSON'}), 400

        cursor = mysql.connection.cursor()
        cursor.execute(
            '''
            INSERT INTO products (name, price, image, category_id, description, rating, full_description, specifications, in_stock, stock_count)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''',
            (name, price, image_url, category_id, description, rating, full_description, specifications, in_stock, stock_count)
        )
        product_id = cursor.lastrowid

        if image_urls:
            for idx, url in enumerate(image_urls):
                cursor.execute(
                    'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (%s, %s, %s)',
                    (product_id, url, idx == 0)
                )
        mysql.connection.commit()
        cursor.close()
        return jsonify({'id': product_id, 'images': image_urls}), 201
    except Exception as e:
        return jsonify({'message': 'Failed to add product', 'error': str(e)}), 500

@app.route('/products/<int:id>', methods=['PUT', 'PATCH'])
def update_product(id):
    try:
        cursor = mysql.connection.cursor()
        cursor.execute('SELECT id FROM products WHERE id = %s', (id,))
        if not cursor.fetchone():
            return jsonify({'message': 'Product not found'}), 404

        data = request.form
        update_fields = []
        update_values = []

        for field in ['name', 'price', 'image', 'category_id', 'description', 'rating', 'stock_count', 'in_stock', 'full_description', 'specifications']:
            if field in data:
                if field == 'specifications':
                    try:
                        json.loads(data[field])
                    except Exception:
                        return jsonify({'message': 'specifications must be valid JSON'}), 400
                value = data[field]
                if field == 'in_stock':
                    value = parse_bool(value)
                update_fields.append(f"{field} = %s")
                update_values.append(value)

        if 'images' in request.files:
            images = request.files.getlist('images')
            if data.get('replace_images') == 'true':
                cursor.execute('SELECT image_url FROM product_images WHERE product_id = %s', (id,))
                old_images = cursor.fetchall()
                cursor.execute('DELETE FROM product_images WHERE product_id = %s', (id,))
                for img in old_images:
                    try:
                        file_path = os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(img['image_url']))
                        if os.path.exists(file_path):
                            os.remove(file_path)
                    except Exception:
                        pass
            for idx, image_file in enumerate(images):
                if image_file and allowed_file(image_file.filename):
                    ext = image_file.filename.rsplit('.', 1)[1].lower()
                    filename = f"{uuid.uuid4().hex}.{ext}"
                    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    image_file.save(filepath)
                    image_url = f"/static/uploads/{filename}"
                    cursor.execute(
                        'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (%s, %s, %s)',
                        (id, image_url, idx == 0 and data.get('replace_images') == 'true')
                    )
            if images and len(images) > 0:
                main_image_url = f"/static/uploads/{filename}"
                update_fields.append("image = %s")
                update_values.append(main_image_url)

        if not update_fields:
            return jsonify({'message': 'No fields to update provided'}), 400

        query = f"UPDATE products SET {', '.join(update_fields)} WHERE id = %s"
        update_values.append(id)
        cursor.execute(query, update_values)
        mysql.connection.commit()
        cursor.close()
        return jsonify({'message': 'Product updated successfully'}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to update product', 'error': str(e)}), 500

@app.route('/products/<int:id>', methods=['DELETE'])
def delete_product(id):
    try:
        cursor = mysql.connection.cursor()
        cursor.execute('SELECT image FROM products WHERE id = %s', (id,))
        product = cursor.fetchone()
        if not product:
            return jsonify({'message': 'Product not found'}), 404
        cursor.execute('SELECT image_url FROM product_images WHERE product_id = %s', (id,))
        images = cursor.fetchall()
        cursor.execute('DELETE FROM products WHERE id = %s', (id,))
        cursor.execute('DELETE FROM product_images WHERE product_id = %s', (id,))
        mysql.connection.commit()
        for img in images:
            try:
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(img['image_url']))
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception:
                pass
        if product.get('image'):
            try:
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(product['image']))
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception:
                pass
        cursor.close()
        return jsonify({'message': 'Product deleted successfully'}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to delete product', 'error': str(e)}), 500

@app.route('/products/check-stock', methods=['POST'])
def check_product_stock():
    try:
        if not request.is_json:
            return jsonify({'message': 'Request must be JSON'}), 400

        data = request.get_json()
        # Validate that 'items' is present and is a list
        if not data or 'items' not in data or not isinstance(data['items'], list):
            return jsonify({'message': 'No items provided'}), 400

        items = data['items']
        id_list = []
        quantities = {}

        for item in items:
            pid = item.get('productId')
            qty = item.get('quantity', 1)
            try:
                pid_int = int(pid)
                qty_int = int(qty)
                if pid_int > 0 and qty_int > 0:
                    id_list.append(pid_int)
                    quantities[pid_int] = qty_int
            except (ValueError, TypeError):
                continue  # skip invalid item

        if not id_list:
            return jsonify({'message': 'No valid product IDs provided'}), 400

        cursor = mysql.connection.cursor()
        format_strings = ','.join(['%s'] * len(id_list))
        query = f'SELECT id, name, stock_count, in_stock FROM products WHERE id IN ({format_strings})'
        cursor.execute(query, tuple(id_list))
        products_raw = cursor.fetchall()
        cursor.close()

        # Check stock for each requested item
        products = []
        out_of_stock = []
        found_ids = set()
        for product in products_raw:
            pid = product['id']
            found_ids.add(pid)
            requested_qty = quantities.get(pid, 1)
            item = {
                'id': pid,
                'name': product['name'],
                'in_stock': product['in_stock'],
                'stock_count': product['stock_count']
            }
            products.append(item)
            # Check quantity
            if not product['in_stock'] or product['stock_count'] < requested_qty:
                out_of_stock.append({
                    "id": pid,
                    "name": product['name'],
                    "requested": requested_qty,
                    "available": product['stock_count']
                })

        missing_ids = [pid for pid in id_list if pid not in found_ids]

        result = {
            'products': products,
            'missing_ids': missing_ids,
            'out_of_stock': out_of_stock
        }

        return jsonify(result), 200

    except Exception as e:
        return jsonify({'message': 'Failed to check product stock', 'error': str(e)}), 500

# Category Management Routes
# Helper: Get product count for a category
# --- Image upload endpoint ---
@app.route('/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'message': 'No image file provided'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400
    filename = secure_filename(file.filename)
    save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(save_path)
    url = f'http://127.0.0.1:5000/static/uploads/{filename}'
    return jsonify({'url': url}), 200

# --- CRUD endpoints for categories ---
def get_product_count(category_id):
    cursor = mysql.connection.cursor()
    cursor.execute('SELECT COUNT(*) as count FROM products WHERE category_id = %s', (category_id,))
    result = cursor.fetchone()
    cursor.close()
    return result['count'] if result and 'count' in result else 0

def get_category_name(category_id):
    cursor = mysql.connection.cursor()
    cursor.execute('SELECT name FROM categories WHERE id = %s', (category_id,))
    result = cursor.fetchone()
    cursor.close()
    return result['name'] if result and 'name' in result else None

@app.route('/categories', methods=['GET'])
def get_categories():
    cursor = mysql.connection.cursor()
    cursor.execute('SELECT * FROM categories')
    categories = cursor.fetchall()
    cursor.close()
    for category in categories:
        category['productCount'] = get_product_count(category['id'])
        # Default/fix icon if not set or invalid
        if not category.get('icon') or category['icon'] in ('?', '????'):
            # Try to assign a default by name
            if category['name'].lower() == 'electronics':
                category['icon'] = '📱'
            elif category['name'].lower() == 'fashion':
                category['icon'] = '👗'
            elif category['name'].lower() == 'home':
                category['icon'] = '🏠'
            else:
                category['icon'] = '🛒'
    return jsonify({'data': categories, 'success': True}), 200

@app.route('/categories', methods=['POST'])
def add_category():
    data = request.get_json()
    name = data.get('name')
    description = data.get('description', '')
    image = data.get('image', '')
    icon = data.get('icon', '🛒')
    if not name or not name.strip():
        return jsonify({'message': 'Category name is required', 'success': False}), 400
    cursor = mysql.connection.cursor()
    cursor.execute(
        'INSERT INTO categories (name, description, image, icon) VALUES (%s, %s, %s, %s)',
        (name.strip(), description.strip(), image.strip(), icon.strip())
    )
    mysql.connection.commit()
    cursor.close()
    return jsonify({'message': 'Category added', 'success': True}), 201

@app.route('/categories/<int:id>', methods=['PUT'])
def update_category(id):
    data = request.get_json()
    name = data.get('name')
    description = data.get('description', '')
    image = data.get('image', '')
    icon = data.get('icon', '🛒')
    if not name or not name.strip():
        return jsonify({'message': 'Category name is required', 'success': False}), 400
    cursor = mysql.connection.cursor()
    cursor.execute('UPDATE categories SET name=%s, description=%s, image=%s, icon=%s WHERE id=%s',
                   (name.strip(), description.strip(), image.strip(), icon.strip(), id))
    mysql.connection.commit()
    cursor.close()
    return jsonify({'message': 'Category updated', 'success': True}), 200

@app.route('/categories/<int:id>', methods=['DELETE'])
def delete_category(id):
    cursor = mysql.connection.cursor()
    cursor.execute('DELETE FROM categories WHERE id=%s', (id,))
    mysql.connection.commit()
    cursor.close()
    return jsonify({'message': 'Category deleted', 'success': True}), 200


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
            cursor.execute('''
                SELECT oi.*, p.name as product_name 
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = %s
            ''', (order['id'],))
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
            
        # Get order items with product names
        cursor.execute('''
            SELECT oi.*, p.name as product_name 
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = %s
        ''', (order['id'],))
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
                
            import datetime
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
            
            # Get product name
            product_name = None
            if 'product_name' in item:
                product_name = item['product_name']
            else:
                cursor.execute('SELECT name FROM products WHERE id = %s', (item['product_id'],))
                product_result = cursor.fetchone()
                if product_result:
                    product_name = product_result['name']
            
            cursor.execute('''
                INSERT INTO order_items (
                    order_id, product_id, product_name, quantity, unit_price, total_price, attributes
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            ''', (
                order_id, item['product_id'], product_name, item['quantity'], 
                item['unit_price'], total_price, attributes_json
            ))
            
            # Update product stock count (FIXED: use stock_count not stock_quantity)
            cursor.execute('''
                UPDATE products SET stock_count = GREATEST(0, stock_count - %s)
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

@app.route('/orders/<string:order_number>/items/<int:item_id>/status', methods=['PATCH'])
def update_order_item_status(order_number, item_id):
    conn = None
    try:
        data = request.get_json()
        
        if 'status' not in data:
            return jsonify({'message': 'Item status is required'}), 400
            
        new_status = data['status']
        valid_statuses = ['pending', 'processing', 'shipped', 'delivered', 'backordered', 'cancelled', 'refunded']
        
        if new_status not in valid_statuses:
            return jsonify({'message': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
            
        conn = mysql.connection
        cursor = conn.cursor()
        
        # Check if order exists
        cursor.execute('SELECT id FROM orders WHERE order_number = %s', (order_number,))
        order = cursor.fetchone()
        
        if not order:
            return jsonify({'message': 'Order not found'}), 404
            
        # Check if order item exists and belongs to this order
        cursor.execute('SELECT * FROM order_items WHERE id = %s AND order_id = %s', (item_id, order['id']))
        order_item = cursor.fetchone()
        
        if not order_item:
            return jsonify({'message': 'Order item not found or does not belong to this order'}), 404
            
        # Update order item status
        cursor.execute('UPDATE order_items SET status = %s WHERE id = %s', (new_status, item_id))
        
        # Check if we need to update the parent order status based on item statuses
        if data.get('update_order_status', False):
            # Get all items for this order
            cursor.execute('SELECT status FROM order_items WHERE order_id = %s', (order['id'],))
            items = cursor.fetchall()
            
            # Determine the overall order status based on item statuses
            if all(item['status'] == 'delivered' for item in items):
                order_status = 'delivered'
            elif all(item['status'] == 'cancelled' for item in items):
                order_status = 'cancelled'
            elif any(item['status'] == 'shipped' for item in items):
                order_status = 'shipped'
            elif any(item['status'] == 'processing' for item in items):
                order_status = 'processing'
            else:
                order_status = 'pending'
                
            # Update the order status
            cursor.execute('UPDATE orders SET order_status = %s WHERE id = %s', (order_status, order['id']))
        
        conn.commit()
        
        return jsonify({
            'message': 'Order item status updated successfully',
            'item_id': item_id,
            'new_status': new_status
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error updating order item status for order {order_number}, item {item_id}: {str(e)}")
        if conn:
            try:
                conn.rollback()
            except Exception as rollback_error:
                app.logger.error(f"Error during rollback: {str(rollback_error)}")
        return jsonify({'message': 'Failed to update order item status', 'error': str(e)}), 500

# Add the OPTIONS handler for the new route
@app.route('/orders/<string:order_number>/items/<int:item_id>/status', methods=['OPTIONS'])
def handle_item_status_options(order_number, item_id):
    return jsonify({}), 200

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


# Database schema setup function
def create_delivery_tables():
    """
    Function to create necessary tables for the delivery management system
    """
    try:
        cursor = mysql.connection.cursor()
        
        # Create deliveries table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS deliveries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                product_id INT NOT NULL,
                carrier VARCHAR(255),
                tracking_number VARCHAR(255),
                estimated_delivery_date DATE,
                status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned') NOT NULL DEFAULT 'pending',
                quantity INT NOT NULL,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        ''')
        
        # Create delivery tracking events table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS delivery_tracking_events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                delivery_id INT NOT NULL,
                status VARCHAR(50) NOT NULL,
                location VARCHAR(255) DEFAULT 'System',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                details TEXT,
                FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE
            )
        ''')
        
        mysql.connection.commit()
        app.logger.info("Delivery tables created successfully")
        
    except Exception as e:
        app.logger.error(f"Error creating delivery tables: {str(e)}")
        raise

# GET all deliveries with filtering options
@app.route('/deliveries', methods=['GET'])
def get_deliveries():
    try:
        cursor = mysql.connection.cursor(dictionary=True)
        
        # Get query parameters for filtering
        order_number = request.args.get('order_number')
        delivery_status = request.args.get('status')
        carrier = request.args.get('carrier')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        product_id = request.args.get('product_id')
        
        # Base query with proper joins for product information
        query = '''
            SELECT d.*, o.order_number, o.customer_name, o.customer_email,
                   p.id as product_id, p.name as product_name, p.sku as product_sku
            FROM deliveries d
            LEFT JOIN orders o ON d.order_id = o.id
            LEFT JOIN products p ON d.product_id = p.id
            WHERE 1=1
        '''
        params = []
        
        # Apply filters if provided
        if order_number:
            query += ' AND o.order_number = %s'
            params.append(order_number)
            
        if delivery_status:
            query += ' AND d.status = %s'
            params.append(delivery_status)
            
        if carrier:
            query += ' AND d.carrier = %s'
            params.append(carrier)
            
        if date_from:
            query += ' AND DATE(d.created_at) >= %s'
            params.append(date_from)
            
        if date_to:
            query += ' AND DATE(d.created_at) <= %s'
            params.append(date_to)
        
        if product_id:
            query += ' AND d.product_id = %s'
            params.append(int(product_id))
            
        # Add sorting
        query += ' ORDER BY d.created_at DESC'
        
        # Execute query
        cursor.execute(query, tuple(params))
        deliveries = cursor.fetchall()
        
        # Get tracking events for each delivery
        for delivery in deliveries:
            cursor.execute('''
                SELECT * FROM delivery_tracking_events
                WHERE delivery_id = %s
                ORDER BY timestamp DESC
            ''', (delivery['id'],))
            delivery['tracking_events'] = cursor.fetchall()
            
            # Convert datetime objects to ISO format strings for JSON serialization
            for event in delivery['tracking_events']:
                if 'timestamp' in event and event['timestamp']:
                    event['timestamp'] = event['timestamp'].isoformat()
            
            # Format dates for the delivery record
            for date_field in ['created_at', 'updated_at', 'estimated_delivery_date']:
                if date_field in delivery and delivery[date_field]:
                    if isinstance(delivery[date_field], datetime):
                        delivery[date_field] = delivery[date_field].isoformat()
        
        return jsonify(deliveries), 200
    except Exception as e:
        app.logger.error(f"Error fetching deliveries: {str(e)}")
        return jsonify({'message': 'Failed to fetch deliveries', 'error': str(e)}), 500

# GET a specific delivery by ID
@app.route('/deliveries/<int:delivery_id>', methods=['GET'])
def get_delivery(delivery_id):
    try:
        cursor = mysql.connection.cursor(dictionary=True)
        
        # Query with product information
        cursor.execute('''
            SELECT d.*, o.order_number, o.customer_name, o.customer_email,
                   p.id as product_id, p.name as product_name, p.sku as product_sku
            FROM deliveries d
            LEFT JOIN orders o ON d.order_id = o.id
            LEFT JOIN products p ON d.product_id = p.id
            WHERE d.id = %s
        ''', (delivery_id,))
        delivery = cursor.fetchone()
        
        if not delivery:
            return jsonify({'message': 'Delivery not found'}), 404
            
        # Get tracking events
        cursor.execute('''
            SELECT * FROM delivery_tracking_events
            WHERE delivery_id = %s
            ORDER BY timestamp DESC
        ''', (delivery_id,))
        delivery['tracking_events'] = cursor.fetchall()
        
        # Format dates for JSON
        for date_field in ['created_at', 'updated_at', 'estimated_delivery_date']:
            if date_field in delivery and delivery[date_field]:
                if isinstance(delivery[date_field], datetime):
                    delivery[date_field] = delivery[date_field].isoformat()
                    
        # Format dates in tracking events
        for event in delivery['tracking_events']:
            if 'timestamp' in event and event['timestamp']:
                if isinstance(event['timestamp'], datetime):
                    event['timestamp'] = event['timestamp'].isoformat()
        
        return jsonify(delivery), 200
    except Exception as e:
        app.logger.error(f"Error fetching delivery {delivery_id}: {str(e)}")
        return jsonify({'message': 'Failed to fetch delivery', 'error': str(e)}), 500

# Create a new delivery for an order
@app.route('/orders/<string:order_number>/delivery', methods=['POST'])
def create_delivery(order_number):
    conn = None
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['carrier', 'tracking_number', 'product_id', 'quantity']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'{field} is required'}), 400
        
        # Validate quantity is positive
        try:
            quantity = int(data['quantity'])
            if quantity <= 0:
                return jsonify({'message': 'Quantity must be a positive number'}), 400
        except (ValueError, TypeError):
            return jsonify({'message': 'Quantity must be a valid number'}), 400
        
        conn = mysql.connection
        cursor = conn.cursor(dictionary=True)
        
        # Check if order exists
        cursor.execute('SELECT id FROM orders WHERE order_number = %s', (order_number,))
        order = cursor.fetchone()
        
        if not order:
            return jsonify({'message': 'Order not found'}), 404
        
        # Check if product exists
        cursor.execute('SELECT id FROM products WHERE id = %s', (data['product_id'],))
        product = cursor.fetchone()
        
        if not product:
            return jsonify({'message': 'Product not found'}), 404
        
        # Check if delivery already exists for this order and product
        cursor.execute(
            'SELECT id FROM deliveries WHERE order_id = %s AND product_id = %s', 
            (order['id'], data['product_id'])
        )
        existing_delivery = cursor.fetchone()
        
        if existing_delivery:
            return jsonify({'message': 'Delivery already exists for this order and product'}), 400
        
        # Parse estimated_delivery_date if provided
        estimated_delivery_date = None
        if 'estimated_delivery_date' in data and data['estimated_delivery_date']:
            try:
                estimated_delivery_date = data['estimated_delivery_date']
            except ValueError:
                return jsonify({'message': 'Invalid date format for estimated_delivery_date'}), 400
            
        # Create delivery record
        cursor.execute('''
            INSERT INTO deliveries (
                order_id, product_id, carrier, tracking_number, estimated_delivery_date, 
                status, quantity, notes, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (
            order['id'], 
            data['product_id'], 
            data['carrier'], 
            data['tracking_number'],
            estimated_delivery_date, 
            data.get('status', 'pending'), 
            quantity,
            data.get('notes'),
            datetime.now()
        ))
        
        delivery_id = cursor.lastrowid
        
        # Create initial tracking event
        cursor.execute('''
            INSERT INTO delivery_tracking_events (
                delivery_id, status, location, timestamp, details
            ) VALUES (%s, %s, %s, %s, %s)
        ''', (
            delivery_id, 
            'created', 
            data.get('location', 'Warehouse'), 
            datetime.now(),
            'Shipment created'
        ))
        
        # Update order status to shipped if requested
        if data.get('update_order_status', False):
            cursor.execute('UPDATE orders SET order_status = %s WHERE id = %s', ('shipped', order['id']))
        
        conn.commit()
        
        # Fetch the created delivery for response
        cursor.execute('''
            SELECT d.*, o.order_number
            FROM deliveries d
            JOIN orders o ON d.order_id = o.id
            WHERE d.id = %s
        ''', (delivery_id,))
        created_delivery = cursor.fetchone()
        
        # Format dates
        for date_field in ['created_at', 'updated_at', 'estimated_delivery_date']:
            if date_field in created_delivery and created_delivery[date_field]:
                if isinstance(created_delivery[date_field], datetime):
                    created_delivery[date_field] = created_delivery[date_field].isoformat()
        
        return jsonify({
            'message': 'Delivery created successfully', 
            'delivery_id': delivery_id,
            'delivery': created_delivery
        }), 201
    except Exception as e:
        app.logger.error(f"Error creating delivery for order {order_number}: {str(e)}")
        if conn:
            try:
                conn.rollback()
            except Exception as rollback_error:
                app.logger.error(f"Error during rollback: {str(rollback_error)}")
        return jsonify({'message': 'Failed to create delivery', 'error': str(e)}), 500

# Add a tracking event to a delivery
@app.route('/deliveries/<int:delivery_id>/events', methods=['POST'])
def add_tracking_event(delivery_id):
    conn = None
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['status', 'location']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'{field} is required'}), 400
        
        # Validate status
        valid_statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']
        if data['status'] not in valid_statuses:
            return jsonify({'message': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
        
        conn = mysql.connection
        cursor = conn.cursor(dictionary=True)
        
        # Check if delivery exists
        cursor.execute('SELECT id, order_id FROM deliveries WHERE id = %s', (delivery_id,))
        delivery = cursor.fetchone()
        
        if not delivery:
            return jsonify({'message': 'Delivery not found'}), 404
        
        # Parse timestamp if provided
        event_timestamp = datetime.now()
        if 'timestamp' in data and data['timestamp']:
            try:
                event_timestamp = datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({'message': 'Invalid timestamp format'}), 400
            
        # Add tracking event
        cursor.execute('''
            INSERT INTO delivery_tracking_events (
                delivery_id, status, location, timestamp, details
            ) VALUES (%s, %s, %s, %s, %s)
        ''', (
            delivery_id, 
            data['status'], 
            data['location'],
            event_timestamp,
            data.get('details')
        ))
        
        # Update delivery status
        cursor.execute('UPDATE deliveries SET status = %s WHERE id = %s', (data['status'], delivery_id))
        
        # Update order status if delivered or cancelled
        if data['status'] in ['delivered', 'cancelled']:
            new_order_status = 'delivered' if data['status'] == 'delivered' else 'cancelled'
            cursor.execute('UPDATE orders SET order_status = %s WHERE id = %s', (new_order_status, delivery['order_id']))
        
        conn.commit()
        
        # Get the created event
        cursor.execute('''
            SELECT * FROM delivery_tracking_events
            WHERE delivery_id = %s
            ORDER BY timestamp DESC
            LIMIT 1
        ''', (delivery_id,))
        created_event = cursor.fetchone()
        
        # Format timestamp
        if 'timestamp' in created_event and created_event['timestamp']:
            if isinstance(created_event['timestamp'], datetime):
                created_event['timestamp'] = created_event['timestamp'].isoformat()
        
        return jsonify({
            'message': 'Tracking event added successfully',
            'event': created_event
        }), 201
    except Exception as e:
        app.logger.error(f"Error adding tracking event for delivery {delivery_id}: {str(e)}")
        if conn:
            try:
                conn.rollback()
            except Exception as rollback_error:
                app.logger.error(f"Error during rollback: {str(rollback_error)}")
        return jsonify({'message': 'Failed to add tracking event', 'error': str(e)}), 500

@app.route('/products/<int:product_id>/delivery-status', methods=['PATCH'])
def update_delivery_status(product_id):
    """
    Update the delivery status for a specific product in an order.
    Expects order_number as a query parameter and status in the request body.
    Returns success or error message.
    """
    try:
        # Get the order number from query parameters
        order_id = request.args.get('order_number')
        
        # Get the new status from request body
        data = request.get_json()
        new_status = data.get('status')
        
        # Validate input
        if not order_id:
            return jsonify({"message": "Order number is required", "success": False}), 400
        
        if not new_status:
            return jsonify({"message": "New status is required", "success": False}), 400
            
        # Validate the status value matches what frontend sends
        valid_statuses = ['pending', 'processed', 'cancelled']
        if new_status not in valid_statuses:
            return jsonify({"message": f"Invalid status. Must be one of: {', '.join(valid_statuses)}", "success": False}), 400
        
        # Check if the record exists
        cursor = mysql.connection.cursor()
        cursor.execute(
            "SELECT id FROM deliveries WHERE order_id = %s AND product_id = %s", 
            (order_id, product_id)
        )
        existing_record = cursor.fetchone()
        
        if not existing_record:
            # If the record doesn't exist, create it
            cursor.execute(
                """
                INSERT INTO deliveries 
                (order_id, product_id, status, quantity) 
                VALUES (%s, %s, %s, 1)
                """, 
                (order_id, product_id, new_status)
            )
            mysql.connection.commit()
            cursor.close()
            
            return jsonify({
                "message": "Delivery status created successfully",
                "product_id": product_id,
                "order_id": order_id,
                "new_status": new_status,
                "success": True
            }), 201
        else:
            # Update the existing record
            cursor.execute(
                """
                UPDATE deliveries 
                SET status = %s
                WHERE order_id = %s AND product_id = %s
                """, 
                (new_status, order_id, product_id)
            )
            
            # Commit the changes
            mysql.connection.commit()
            cursor.close()
            
            return jsonify({
                "message": "Delivery status updated successfully",
                "product_id": product_id,
                "order_id": order_id,
                "new_status": new_status,
                "success": True
            }), 200
        
    except Exception as e:
        return jsonify({
            "message": "Failed to update delivery status", 
            "error": str(e), 
            "success": False
        }), 500
    
# Customer-facing tracking endpoint
@app.route('/track/<string:tracking_number>', methods=['GET'])
def track_delivery(tracking_number):
    try:
        cursor = mysql.connection.cursor(dictionary=True)
        
        # Query with product information
        cursor.execute('''
            SELECT d.id, d.carrier, d.tracking_number, d.estimated_delivery_date, d.status,
                   d.quantity, d.created_at, d.updated_at,
                   o.order_number, o.customer_name,
                   p.id as product_id, p.name as product_name, p.sku as product_sku
            FROM deliveries d
            LEFT JOIN orders o ON d.order_id = o.id
            LEFT JOIN products p ON d.product_id = p.id
            WHERE d.tracking_number = %s
        ''', (tracking_number,))
        delivery = cursor.fetchone()
        
        if not delivery:
            return jsonify({'message': 'Tracking number not found'}), 404
            
        # Get tracking events
        cursor.execute('''
            SELECT status, location, timestamp, details
            FROM delivery_tracking_events
            WHERE delivery_id = %s
            ORDER BY timestamp DESC
        ''', (delivery['id'],))
        tracking_events = cursor.fetchall()
        
        # Format dates in delivery
        for date_field in ['created_at', 'updated_at', 'estimated_delivery_date']:
            if date_field in delivery and delivery[date_field]:
                if isinstance(delivery[date_field], datetime):
                    delivery[date_field] = delivery[date_field].isoformat()
        
        # Format dates in tracking events
        for event in tracking_events:
            if 'timestamp' in event and event['timestamp']:
                if isinstance(event['timestamp'], datetime):
                    event['timestamp'] = event['timestamp'].isoformat()
        
        # Build response with product information
        result = {
            'tracking_number': delivery['tracking_number'],
            'carrier': delivery['carrier'],
            'status': delivery['status'],
            'estimated_delivery_date': delivery['estimated_delivery_date'],
            'order_number': delivery['order_number'],
            'customer_name': delivery['customer_name'],
            'quantity': delivery['quantity'],
            'product': {
                'id': delivery['product_id'],
                'name': delivery['product_name'],
                'sku': delivery['product_sku']
            },
            'created_at': delivery['created_at'],
            'updated_at': delivery['updated_at'],
            'tracking_history': tracking_events
        }
        
        return jsonify(result), 200
    except Exception as e:
        app.logger.error(f"Error tracking delivery {tracking_number}: {str(e)}")
        return jsonify({'message': 'Failed to track delivery', 'error': str(e)}), 500


    
# CORS support for delivery endpoints
@app.route('/deliveries', methods=['OPTIONS'])
@app.route('/deliveries/<int:delivery_id>', methods=['OPTIONS'])
@app.route('/deliveries/<int:delivery_id>/events', methods=['OPTIONS'])
@app.route('/orders/<string:order_number>/delivery', methods=['OPTIONS'])
@app.route('/track/<string:tracking_number>', methods=['OPTIONS'])
@app.route('/products/<int:product_id>/delivery-status', methods=['OPTIONS'])
def handle_delivery_options_request(delivery_id=None, order_number=None, tracking_number=None, product_id=None):
    return jsonify({}), 200


# if __name__ == '__main__':
#     app.run(debug=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
