import React from 'react';

function ShowCourseComponent({  filterCourseFunction, addCourseToCartFunction }) {
    return (
        <div className="product-list">
            {filterCourseFunction.length === 0 ? (
                <p className="no-results">
                    Sorry, no matching products found.
                </p>
            ) : (
                filterCourseFunction.map((product) => (
                    <div className="product" key={product.id}>
                        {/* Display product images */}
                        <div className="product-images">
                            {product.images && product.images.map((image, index) => (
                                <img
                                    key={index}
                                    src={`http://localhost:5000/${image}`}
                                    alt={`${product.name} ${index + 1}`}
                                    className="product-image"
                                />
                            ))}
                        </div>
                        <h2>{product.name}</h2>
                        <p className="product-price">Price: ${product.price}</p>
                        <p className="product-description">{product.description}</p>
                        <button
                            className="add-to-cart-button"
                            onClick={() => addCourseToCartFunction(product)}
                        >
                            Add to Shopping Cart
                        </button>
                    </div>
                ))
            )}
        </div>
    );
}

export default ShowCourseComponent;