import { useState } from 'react';
import {
  Search,
  ShoppingCart,
  Star,
  Award,
  Filter,
  Eye,
  Plus,
} from 'lucide-react';
import { Stack, Row, Text } from '@unicornlove/beyond-ui';
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
    <Stack style={{ gap: 24 }}>
      {/* Header */}
      <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack>
          <Text style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-12)' }}>Insurance Marketplace</Text>
          <Text style={{ color: 'var(--color-11)' }}>
            Find and purchase insurance coverage for your projects
          </Text>
        </Stack>
        <Row style={{ position: 'relative' }}>
          <Button
            onClick={() => setShowCart(!showCart)}
            variant="primary"
          >
            <Row style={{ alignItems: 'center', gap: 8 }}>
              <ShoppingCart size={16} />
              <Text>Cart</Text>
            </Row>
          </Button>
          <Row
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              backgroundColor: 'var(--color-red-9)',
              width: 20,
              height: 20,
              borderRadius: 9999,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 12, color: 'white' }}>
              2
            </Text>
          </Row>
        </Row>
      </Row>

      {/* Search and Filters */}
      <div style={{ padding: 16, borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-border)', borderRadius: 8, backgroundColor: 'var(--color-background)' }}>
        <Stack style={{ gap: 16 }}>
          <Row style={{ flex: 1, position: 'relative', alignItems: 'center' }}>
            <Row
              style={{
                position: 'absolute',
                left: 12,
                zIndex: 1,
              }}
            >
              <Search color="var(--color-10)" size={20} />
            </Row>
            <input
              type="text"
              placeholder="Search insurance types or providers..."
              style={{
                width: '100%',
                paddingLeft: '2.5rem',
                paddingRight: '1rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: 'var(--color-border)',
                borderRadius: 8,
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Row>
          <Row style={{ flexWrap: 'wrap', gap: 8 }}>
            {categories.map((category) => (
              <Button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                variant={selectedCategory === category.id ? 'primary' : 'ghost'}
              >
                {category.name}
              </Button>
            ))}
          </Row>
        </Stack>
      </div>

      {/* Featured Recommendations */}
      <div
        style={{
          padding: 24,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: 'var(--color-blue-5)',
          borderRadius: 8,
          backgroundColor: 'var(--color-blue-2)',
        }}
      >
        <Row style={{ alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Award color="var(--color-blue-9)" size={20} />
          <Text style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-12)' }}>
            Recommended for Construction Projects
          </Text>
        </Row>
        <Row style={{ flexWrap: 'wrap', gap: 16 }}>
          {insuranceProducts
            .filter((p) => p.recommended)
            .map((product) => (
              <div
                key={product.id}
                style={{
                  backgroundColor: 'var(--color-background)',
                  padding: 16,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: 'var(--color-blue-5)',
                  flex: 1,
                  minWidth: 200,
                }}
              >
                <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontWeight: 500, color: 'var(--color-12)' }}>
                    {product.type}
                  </Text>
                  <Row style={{ alignItems: 'center', gap: 4 }}>
                    <Star color="var(--color-yellow-9)" fill="currentColor" size={14} />
                    <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
                      {product.rating}
                    </Text>
                  </Row>
                </Row>
                <Text style={{ fontSize: 14, color: 'var(--color-11)', marginBottom: 12 }}>
                  {product.provider}
                </Text>
                <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <Stack>
                    <Text style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-12)' }}>
                      ${product.price.toLocaleString()}/yr
                    </Text>
                    <Text style={{ fontSize: 12, color: 'var(--color-11)' }}>
                      ${product.coverage.toLocaleString()} coverage
                    </Text>
                  </Stack>
                  <Button size="sm" variant="primary">
                    Add to Cart
                  </Button>
                </Row>
              </div>
            ))}
        </Row>
      </div>

      {/* Product Grid */}
      <Row style={{ flexWrap: 'wrap', gap: 24 }}>
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            style={{
              backgroundColor: 'var(--color-background)',
              borderRadius: 8,
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: 'var(--color-border)',
              flex: 1,
              minWidth: 300,
              maxWidth: 400,
            }}
          >
            <Stack style={{ padding: 24 }}>
              {/* Header */}
              <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <Stack>
                  <Row style={{ alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Text style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-12)' }}>
                      {product.type}
                    </Text>
                    {product.popular && (
                      <Row
                        style={{
                          backgroundColor: 'var(--color-green-2)',
                          paddingLeft: 8,
                          paddingRight: 8,
                          paddingTop: 4,
                          paddingBottom: 4,
                          borderRadius: 9999,
                        }}
                      >
                        <Text style={{ fontSize: 12, color: 'var(--color-green-11)' }}>
                          Popular
                        </Text>
                      </Row>
                    )}
                  </Row>
                  <Text style={{ color: 'var(--color-11)' }}>{product.provider}</Text>
                </Stack>
                <Row style={{ alignItems: 'center', gap: 4 }}>
                  <Star color="var(--color-yellow-9)" fill="currentColor" size={16} />
                  <Text style={{ fontSize: 14, fontWeight: 500 }}>
                    {product.rating}
                  </Text>
                </Row>
              </Row>

              {/* Pricing */}
              <Stack style={{ marginBottom: 16 }}>
                <Row style={{ alignItems: 'baseline', gap: 8 }}>
                  <Text style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-12)' }}>
                    ${product.price.toLocaleString()}
                  </Text>
                  <Text style={{ color: 'var(--color-11)' }}>/year</Text>
                </Row>
                <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
                  Up to ${product.coverage.toLocaleString()} coverage
                </Text>
              </Stack>

              {/* Features */}
              <Stack style={{ marginBottom: 24 }}>
                <Stack style={{ gap: 8 }}>
                  {product.features.map((feature, index) => (
                    <Row key={index} style={{ alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          backgroundColor: 'var(--color-green-9)',
                          borderRadius: 9999,
                        }}
                      />
                      <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
                        {feature}
                      </Text>
                    </Row>
                  ))}
                </Stack>
              </Stack>

              {/* Actions */}
              <Row style={{ gap: 8 }}>
                <Button
                  style={{ flex: 1 }}
                  variant="primary"
                >
                  <Row style={{ alignItems: 'center', gap: 8 }}>
                    <Plus size={16} />
                    <Text>Add to Cart</Text>
                  </Row>
                </Button>
                <IconButton
                  icon={Eye}
                  size="md"
                  variant="outline"
                  tooltip="View details"
                />
              </Row>
            </Stack>
          </div>
        ))}
      </Row>

      {/* Shopping Cart Sidebar */}
      {showCart && (
        <Row
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 50,
          }}
        >
          <Row
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              height: '100%',
              width: 384,
              backgroundColor: 'var(--color-background)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
          >
            <Stack style={{ padding: 24, borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)' }}>
              <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-12)' }}>
                  Shopping Cart
                </Text>
                <Button
                  onClick={() => setShowCart(false)}
                  variant="ghost"
                  size="sm"
                >
                  x
                </Button>
              </Row>
            </Stack>
            <Stack style={{ padding: 24, flex: 1 }}>
              <Stack style={{ gap: 16 }}>
                <Row
                  style={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 12,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: 'var(--color-border)',
                    borderRadius: 8,
                  }}
                >
                  <Stack>
                    <Text style={{ fontWeight: 500 }}>General Liability</Text>
                    <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
                      State Farm
                    </Text>
                  </Stack>
                  <Text style={{ fontWeight: 700 }}>$2,400/yr</Text>
                </Row>
                <Row
                  style={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 12,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: 'var(--color-border)',
                    borderRadius: 8,
                  }}
                >
                  <Stack>
                    <Text style={{ fontWeight: 500 }}>Workers Compensation</Text>
                    <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
                      Travelers
                    </Text>
                  </Stack>
                  <Text style={{ fontWeight: 700 }}>$3,200/yr</Text>
                </Row>
              </Stack>
              <Stack style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'var(--color-border)' }}>
                <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 18, fontWeight: 700 }}>
                    Total:
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: 700 }}>
                    $5,600/yr
                  </Text>
                </Row>
                <Button
                  style={{ flex: 1, marginTop: 16 }}
                  size="lg"
                  variant="primary"
                >
                  Proceed to Checkout
                </Button>
              </Stack>
            </Stack>
          </Row>
        </Row>
      )}

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: 8,
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: 'var(--color-border)',
            padding: 48,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Search size={48} color="var(--color-6)" style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-12)', marginBottom: 8 }}>
            No insurance products found
          </Text>
          <Text style={{ color: 'var(--color-11)' }}>
            Try adjusting your search terms or category filters
          </Text>
        </div>
      )}
    </Stack>
  );
}
