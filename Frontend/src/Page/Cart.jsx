import React, { useEffect, useState } from 'react';
import SearchComponent from '../components/SearchComponent';
import ShowCourseComponent from '../components/ShowCourseComponent';
import UserCartComponent from '../components/UserCartComponent';
function Cart() {
    const [products, setProducts] = useState([]);
    const [error, setError] = useState('');
    const [cartCourses, setCartCourses] = useState([]);
    const [searchCourse, setSearchCourse] = useState('');

    // Fetch products from the backend
    const fetchProducts = async () => {
        try {
            const response = await fetch('http://localhost:5000/products');
            const data = await response.json();
            setProducts(data);
        } catch (err) {
            setError('Failed to fetch products');
        }
    };

    // Load cart data from localStorage on component mount
    useEffect(() => {
        const savedCart = localStorage.getItem('cartCourses');
        if (savedCart) {
            try {
                setCartCourses(JSON.parse(savedCart));
            } catch (err) {
                console.error('Error parsing saved cart:', err);
                // Reset cart if there's an error
                localStorage.removeItem('cartCourses');
            }
        }
        
        fetchProducts();
    }, []);

    // Save cart data to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('cartCourses', JSON.stringify(cartCourses));
    }, [cartCourses]);

    // Add a course to the cart
    const addCourseToCartFunction = (GFGcourse) => {
        const alreadyCourses = cartCourses.find(item => item.product.id === GFGcourse.id);
        if (alreadyCourses) {
            const latestCartUpdate = cartCourses.map(item =>
                item.product.id === GFGcourse.id ? { 
                    ...item, quantity: item.quantity + 1 
                } : item
            );
            setCartCourses(latestCartUpdate);
        } else {
            setCartCourses([...cartCourses, { product: GFGcourse, quantity: 1 }]);
        }
    };

    // Delete a course from the cart
    const deleteCourseFromCartFunction = (GFGCourse) => {
        const updatedCart = cartCourses.filter(item => item.product.id !== GFGCourse.id);
        setCartCourses(updatedCart);
    };

    // Calculate the total amount of the cart
    const totalAmountCalculationFunction = () => {
        return cartCourses.reduce((total, item) => 
            total + item.product.price * item.quantity, 0
        );
    };

    // Handle search input
    const courseSearchUserFunction = (event) => {
        setSearchCourse(event.target.value);
    };

    // Filter products based on search input
    const filterCourseFunction = products.filter((course) =>
        course.name.toLowerCase().includes(searchCourse.toLowerCase())
    );

    // Clear cart completely
    const clearCart = () => {
        setCartCourses([]);
        localStorage.removeItem('cartCourses');
    };

    return (
        <div className="App">
            <SearchComponent 
                searchCourse={searchCourse} 
                courseSearchUserFunction={courseSearchUserFunction} 
            />
            <main className="App-main">
                <ShowCourseComponent
                    courses={products}
                    filterCourseFunction={filterCourseFunction}
                    addCourseToCartFunction={addCourseToCartFunction}
                />

                <UserCartComponent
                    cartCourses={cartCourses}
                    deleteCourseFromCartFunction={deleteCourseFromCartFunction}
                    totalAmountCalculationFunction={totalAmountCalculationFunction}
                    setCartCourses={setCartCourses}
                    clearCart={clearCart}
                />
            </main>
        </div>
    );
}

export default Cart;