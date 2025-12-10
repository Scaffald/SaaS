import React, { useState } from 'react';
import {
  Search,
  ShoppingCart,
  Star,
  Award,
  Filter,
  Eye,
  Plus,
} from 'lucide-react';
import Button from '../Common/Button';
import IconButton from '../Common/IconButton';

interface Insurance {
  id: string;
  type: string;
  provider: string;
  rating: number;
  price: number;
  coverage: number;
  features: string[];
  recommended: boolean;
  popular: boolean;
}

export default function InsuranceMarketplace() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCart, setShowCart] = useState(false);

  const insuranceProducts: Insurance[] = [
    {
      id: '1',
      type: 'General Liability',
      provider: 'State Farm',
      rating: 4.8,
      price: 2400,
      coverage: 2000000,
      features: [
        'Bodily injury protection',
        'Property damage coverage',
        '24/7 claims support',
      ],
      recommended: true,
      popular: true,
    },
    {
      id: '2',
      type: 'Professional Liability',
      provider: 'Liberty Mutual',
      rating: 4.6,
      price: 1800,
      coverage: 1000000,
      features: [
        'Errors & omissions',
        'Cyber liability included',
        'Legal defense costs',
      ],
      recommended: false,
      popular: false,
    },
    {
      id: '3',
      type: 'Workers Compensation',
      provider: 'Travelers',
      rating: 4.7,
      price: 3200,
      coverage: 1000000,
      features: [
        'Medical expenses',
        'Lost wage coverage',
        'Return-to-work programs',
      ],
      recommended: true,
      popular: true,
    },
    {
      id: '4',
      type: 'Commercial Auto',
      provider: 'Progressive',
      rating: 4.5,
      price: 1600,
      coverage: 500000,
      features: [
        'Vehicle damage',
        'Liability coverage',
        'Rental reimbursement',
      ],
      recommended: false,
      popular: false,
    },
  ];

  const categories = [
    { id: 'all', name: 'All Coverage' },
    { id: 'liability', name: 'Liability' },
    { id: 'property', name: 'Property' },
    { id: 'workers-comp', name: 'Workers Comp' },
    { id: 'auto', name: 'Commercial Auto' },
  ];

  const filteredProducts = insuranceProducts.filter((product) => {
    const matchesSearch =
      product.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' ||
      product.type.toLowerCase().includes(selectedCategory.replace('-', ' '));
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Insurance Marketplace
          </h1>
          <p className="text-text-secondary">
            Find and purchase insurance coverage for your projects
          </p>
        </div>
        <Button
          onClick={() => setShowCart(!showCart)}
          variant="primary"
          leftIcon={ShoppingCart}
          iconSize={16}
          className="relative bg-blue-600 hover:bg-blue-700"
        >
          Cart
          <span className="absolute -top-2 -right-2 bg-error-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            2
          </span>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-surface rounded-lg shadow-sm border border-border p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary"
              size={20}
            />
            <input
              type="text"
              placeholder="Search insurance types or providers..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                variant={selectedCategory === category.id ? 'primary' : 'ghost'}
                className={
                  selectedCategory === category.id ? 'bg-blue-600' : ''
                }
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Recommendations */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center space-x-2 mb-4">
          <Award className="text-primary-600" size={20} />
          <h2 className="text-lg font-semibold text-text-primary">
            Recommended for Construction Projects
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insuranceProducts
            .filter((p) => p.recommended)
            .map((product) => (
              <div
                key={product.id}
                className="bg-surface p-4 rounded-lg border border-blue-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-text-primary">
                    {product.type}
                  </h3>
                  <div className="flex items-center space-x-1">
                    <Star className="text-yellow-400 fill-current" size={14} />
                    <span className="text-sm text-text-secondary">
                      {product.rating}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-text-secondary mb-3">
                  {product.provider}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-text-primary">
                      ${product.price.toLocaleString()}/yr
                    </p>
                    <p className="text-xs text-text-secondary">
                      ${product.coverage.toLocaleString()} coverage
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-surface rounded-lg shadow-sm border border-border hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-lg font-semibold text-text-primary">
                      {product.type}
                    </h3>
                    {product.popular && (
                      <span className="bg-success-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-text-secondary">{product.provider}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="text-yellow-400 fill-current" size={16} />
                  <span className="text-sm font-medium">{product.rating}</span>
                </div>
              </div>

              {/* Pricing */}
              <div className="mb-4">
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-text-primary">
                    ${product.price.toLocaleString()}
                  </span>
                  <span className="text-text-secondary">/year</span>
                </div>
                <p className="text-sm text-text-secondary">
                  Up to ${product.coverage.toLocaleString()} coverage
                </p>
              </div>

              {/* Features */}
              <div className="mb-6">
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li
                      key={index}
                      className="text-sm text-text-secondary flex items-center space-x-2"
                    >
                      <div className="w-1.5 h-1.5 bg-success-500 rounded-full"></div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Button
                  fullWidth
                  variant="primary"
                  leftIcon={Plus}
                  iconSize={16}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Add to Cart
                </Button>
                <IconButton
                  icon={Eye}
                  size="md"
                  variant="outline"
                  tooltip="View details"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Shopping Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute right-0 top-0 h-full w-96 bg-surface shadow-2xl">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-primary">
                  Shopping Cart
                </h2>
                <Button
                  onClick={() => setShowCart(false)}
                  variant="ghost"
                  size="sm"
                >
                  ×
                </Button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium">General Liability</p>
                    <p className="text-sm text-text-secondary">State Farm</p>
                  </div>
                  <p className="font-bold">$2,400/yr</p>
                </div>
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium">Workers Compensation</p>
                    <p className="text-sm text-text-secondary">Travelers</p>
                  </div>
                  <p className="font-bold">$3,200/yr</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>$5,600/yr</span>
                </div>
                <Button
                  fullWidth
                  size="lg"
                  variant="primary"
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  Proceed to Checkout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="bg-surface rounded-lg shadow-sm border border-border p-12 text-center">
          <Search size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-text-primary mb-2">
            No insurance products found
          </h3>
          <p className="text-text-secondary">
            Try adjusting your search terms or category filters
          </p>
        </div>
      )}
    </div>
  );
}
