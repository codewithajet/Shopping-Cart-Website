import React from 'react';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube, CreditCard, Shield, Truck, HelpCircle } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-200">
        {/* Top section with newsletter */}
        <div className="max-w-[1400px]  mx-auto px-4 py-8">
            <div className="bg-gray-50 rounded-lg p-6 mb-8 flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
                <h3 className="text-xl font-bold text-gray-800">Subscribe to our newsletter</h3>
                <p className="text-gray-600 mt-1">Get updates on new products and exclusive offers</p>
            </div>
            <div className="w-full md:w-auto flex flex-col sm:flex-row">
                <input 
                type="email" 
                placeholder="Your Email" 
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light mb-2 sm:mb-0 sm:mr-2"
                />
                <button className="bg-primary-color hover:bg-primary-dark text-white font-medium px-6 py-2 rounded-lg transition-colors duration-300">
                Subscribe
                </button>
            </div>
            </div>
        </div>
        
        {/* Main footer content */}
        <div className=" max-w-[1400px] mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {/* Shop section */}
            <div>
            <h3 className="font-bold text-lg mb-4 text-gray-800">Shop</h3>
            <ul className="space-y-2">
                {['New Arrivals', 'Best Sellers', 'On Sale', 'Deals', 'Collections', 'All Products'].map((item) => (
                <li key={item}>
                    <a href="#" className="text-gray-600 hover:text-primary-color transition-colors duration-300">
                    {item}
                    </a>
                </li>
                ))}
            </ul>
            </div>
            
            {/* Customer Service section */}
            <div>
            <h3 className="font-bold text-lg mb-4 text-gray-800">Customer Service</h3>
            <ul className="space-y-2">
                {['Contact Us', 'FAQs', 'Shipping Policy', 'Returns & Exchanges', 'Order Tracking', 'Gift Cards'].map((item) => (
                <li key={item}>
                    <a href="#" className="text-gray-600 hover:text-primary-color transition-colors duration-300">
                    {item}
                    </a>
                </li>
                ))}
            </ul>
            </div>
            
            {/* About section */}
            <div>
            <h3 className="font-bold text-lg mb-4 text-gray-800">About Us</h3>
            <ul className="space-y-2">
                {['Our Story', 'Careers', 'Press', 'Blog', 'Sustainability', 'Investors'].map((item) => (
                <li key={item}>
                    <a href="#" className="text-gray-600 hover:text-primary-color transition-colors duration-300">
                    {item}
                    </a>
                </li>
                ))}
            </ul>
            </div>
            
            {/* Contact section */}
            <div>
            <h3 className="font-bold text-lg mb-4 text-gray-800">Contact</h3>
            <ul className="space-y-3">
                <li className="flex items-center">
                <Phone size={18} className="text-primary-color mr-2" />
                <span className="text-gray-600">+234 906 851 8858</span>
                </li>
                <li className="flex items-center">
                <Mail size={18} className="text-primary-color mr-2" />
                <span className="text-gray-600">support@Kidaf.com</span>
                </li>
                <li className="flex items-start">
                <MapPin size={18} className="text-primary-color mr-2 mt-1" />
                <span className="text-gray-600">83A TOS Benson Estate, Ikorodu, Lagos</span>
                </li>
            </ul>
            
            <div className="mt-6">
                <h4 className="font-semibold mb-3 text-gray-800">Follow Us</h4>
                <div className="flex space-x-4">
                <a href="#" className="bg-primary-light text-white p-2 rounded-full hover:bg-primary-dark transition-colors duration-300">
                    <Facebook size={18} />
                </a>
                <a href="#" className="bg-primary-light text-white p-2 rounded-full hover:bg-primary-dark transition-colors duration-300">
                    <Twitter size={18} />
                </a>
                <a href="#" className="bg-primary-light text-white p-2 rounded-full hover:bg-primary-dark transition-colors duration-300">
                    <Instagram size={18} />
                </a>
                <a href="#" className="bg-primary-light text-white p-2 rounded-full hover:bg-primary-dark transition-colors duration-300">
                    <Youtube size={18} />
                </a>
                </div>
            </div>
            </div>
        </div>
        
        {/* Trust badges section */}
        <div className="border-t border-gray-200">
            <div className="max-w-[1400px]  mx-auto px-4 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex items-center justify-center sm:justify-start">
                <Truck size={24} className="text-primary-color mr-3" />
                <div>
                    <h4 className="font-medium text-gray-800">Fast Delivery</h4>
                    <p className="text-sm text-gray-600">Free on orders over ₦10,000</p>
                </div>
                </div>
                <div className="flex items-center justify-center">
                <Shield size={24} className="text-primary-color mr-3" />
                <div>
                    <h4 className="font-medium text-gray-800">Secure Payments</h4>
                    <p className="text-sm text-gray-600">Protected by encryption</p>
                </div>
                </div>
                <div className="flex items-center justify-center sm:justify-end">
                <HelpCircle size={24} className="text-primary-color mr-3" />
                <div>
                    <h4 className="font-medium text-gray-800">24/7 Support</h4>
                    <p className="text-sm text-gray-600">Always here to help</p>
                </div>
                </div>
            </div>
            </div>
        </div>
        
        {/* Payment methods and copyright section */}
        <div className="bg-gray-50">
            <div className="max-w-[1400px] mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0">
                <p className="text-sm text-gray-600">&copy; {new Date().getFullYear()} Kidaf. All rights reserved.</p>
                <div className="mt-2 flex space-x-4">
                    <a href="#" className="text-xs text-gray-500 hover:text-primary-color transition-colors duration-300">Privacy Policy</a>
                    <a href="#" className="text-xs text-gray-500 hover:text-primary-color transition-colors duration-300">Terms of Service</a>
                    <a href="#" className="text-xs text-gray-500 hover:text-primary-color transition-colors duration-300">Cookie Policy</a>
                </div>
                </div>
                <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-600 mr-2">Payment Methods:</span>
                <div className="flex space-x-2">
                    {[
                      { name: 'Visa', icon: <CreditCard size={16} className="mr-1" /> },
                      { name: 'Mastercard', icon: <CreditCard size={16} className="mr-1" /> },
                      { name: 'Amex', icon: <CreditCard size={16} className="mr-1" /> },
                      { name: 'PayPal', icon: <CreditCard size={16} className="mr-1" /> },
                      { name: 'Apple Pay', icon: <CreditCard size={16} className="mr-1" /> }
                    ].map((method) => (
                    <div key={method.name} className="bg-white px-2 py-1 rounded border border-gray-200 flex items-center">
                        {method.icon}
                        <span className="text-xs font-medium">{method.name}</span>
                    </div>
                    ))}
                </div>
                </div>
            </div>
            </div>
        </div>
        </footer>
    );
};
export default Footer;