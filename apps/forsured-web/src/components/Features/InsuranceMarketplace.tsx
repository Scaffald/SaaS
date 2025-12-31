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
import { XStack, YStack, Text, H1, SizableText, Card } from '@unicornlove/ui';
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
    <YStack gap="$6">
      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between">
        <YStack>
          <H1>Insurance Marketplace</H1>
          <SizableText color="$color11">
            Find and purchase insurance coverage for your projects
          </SizableText>
        </YStack>
        <XStack position="relative">
          <Button
            onPress={() => setShowCart(!showCart)}
            variant="primary"
          >
            <XStack alignItems="center" gap="$2">
              <ShoppingCart size={16} />
              <Text>Cart</Text>
            </XStack>
          </Button>
          <XStack
            position="absolute"
            top={-8}
            right={-8}
            backgroundColor="$red9"
            width={20}
            height={20}
            borderRadius={9999}
            alignItems="center"
            justifyContent="center"
          >
            <SizableText size="$1" color="white">
              2
            </SizableText>
          </XStack>
        </XStack>
      </XStack>

      {/* Search and Filters */}
      <Card padding="$4" borderWidth={1} borderColor="$borderColor" borderRadius="$4">
        <YStack gap="$4" $gtMd={{ flexDirection: 'row' }}>
          <XStack flex={1} position="relative" alignItems="center">
            <XStack
              position="absolute"
              left="$3"
              zIndex={1}
            >
              <Search color="$color10" size={20} />
            </XStack>
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
                borderColor: 'var(--borderColor)',
                borderRadius: 'var(--radius4)',
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </XStack>
          <XStack flexWrap="wrap" gap="$2">
            {categories.map((category) => (
              <Button
                key={category.id}
                onPress={() => setSelectedCategory(category.id)}
                variant={selectedCategory === category.id ? 'primary' : 'ghost'}
              >
                {category.name}
              </Button>
            ))}
          </XStack>
        </YStack>
      </Card>

      {/* Featured Recommendations */}
      <Card
        padding="$6"
        borderWidth={1}
        borderColor="$blue5"
        borderRadius="$4"
        backgroundColor="$blue2"
      >
        <XStack alignItems="center" gap="$2" mb="$4">
          <Award color="$blue9" size={20} />
          <Text fontSize="$6" fontWeight="600" color="$color12">
            Recommended for Construction Projects
          </Text>
        </XStack>
        <XStack flexWrap="wrap" gap="$4" $gtMd={{ flexDirection: 'row' }}>
          {insuranceProducts
            .filter((p) => p.recommended)
            .map((product) => (
              <Card
                key={product.id}
                backgroundColor="$background"
                padding="$4"
                borderRadius="$4"
                borderWidth={1}
                borderColor="$blue5"
                flex={1}
                minWidth="200px"
              >
                <XStack alignItems="center" justifyContent="space-between" mb="$2">
                  <Text fontWeight="500" color="$color12">
                    {product.type}
                  </Text>
                  <XStack alignItems="center" gap="$1">
                    <Star color="$yellow9" fill="currentColor" size={14} />
                    <SizableText size="$3" color="$color11">
                      {product.rating}
                    </SizableText>
                  </XStack>
                </XStack>
                <SizableText size="$3" color="$color11" mb="$3">
                  {product.provider}
                </SizableText>
                <XStack alignItems="center" justifyContent="space-between">
                  <YStack>
                    <Text fontSize="$6" fontWeight="700" color="$color12">
                      ${product.price.toLocaleString()}/yr
                    </Text>
                    <SizableText size="$1" color="$color11">
                      ${product.coverage.toLocaleString()} coverage
                    </SizableText>
                  </YStack>
                  <Button size="$3" variant="primary">
                    Add to Cart
                  </Button>
                </XStack>
              </Card>
            ))}
        </XStack>
      </Card>

      {/* Product Grid */}
      <XStack flexWrap="wrap" gap="$6" $gtLg={{ flexDirection: 'row' }}>
        {filteredProducts.map((product) => (
          <Card
            key={product.id}
            backgroundColor="$background"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$borderColor"
            hoverStyle={{
              elevation: 2,
            }}
            flex={1}
            minWidth="300px"
            maxWidth="400px"
          >
            <YStack padding="$6">
              {/* Header */}
              <XStack alignItems="flex-start" justifyContent="space-between" mb="$4">
                <YStack>
                  <XStack alignItems="center" gap="$2" mb="$1">
                    <Text fontSize="$6" fontWeight="600" color="$color12">
                      {product.type}
                    </Text>
                    {product.popular && (
                      <XStack
                        backgroundColor="$green2"
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius={9999}
                      >
                        <SizableText size="$1" color="$green11">
                          Popular
                        </SizableText>
                      </XStack>
                    )}
                  </XStack>
                  <SizableText color="$color11">{product.provider}</SizableText>
                </YStack>
                <XStack alignItems="center" gap="$1">
                  <Star color="$yellow9" fill="currentColor" size={16} />
                  <SizableText size="$3" fontWeight="500">
                    {product.rating}
                  </SizableText>
                </XStack>
              </XStack>

              {/* Pricing */}
              <YStack mb="$4">
                <XStack alignItems="baseline" gap="$2">
                  <Text fontSize="$9" fontWeight="700" color="$color12">
                    ${product.price.toLocaleString()}
                  </Text>
                  <SizableText color="$color11">/year</SizableText>
                </XStack>
                <SizableText size="$3" color="$color11">
                  Up to ${product.coverage.toLocaleString()} coverage
                </SizableText>
              </YStack>

              {/* Features */}
              <YStack mb="$6">
                <YStack gap="$2">
                  {product.features.map((feature, index) => (
                    <XStack key={index} alignItems="center" gap="$2">
                      <XStack
                        width={6}
                        height={6}
                        backgroundColor="$green9"
                        borderRadius={9999}
                      />
                      <SizableText size="$3" color="$color11">
                        {feature}
                      </SizableText>
                    </XStack>
                  ))}
                </YStack>
              </YStack>

              {/* Actions */}
              <XStack gap="$2">
                <Button
                  flex={1}
                  variant="primary"
                >
                  <XStack alignItems="center" gap="$2">
                    <Plus size={16} />
                    <Text>Add to Cart</Text>
                  </XStack>
                </Button>
                <IconButton
                  icon={Eye}
                  size="md"
                  variant="outline"
                  tooltip="View details"
                />
              </XStack>
            </YStack>
          </Card>
        ))}
      </XStack>

      {/* Shopping Cart Sidebar */}
      {showCart && (
        <XStack
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          backgroundColor="rgba(0,0,0,0.5)"
          zIndex={50}
        >
          <XStack
            position="absolute"
            right={0}
            top={0}
            height="100%"
            width={384}
            backgroundColor="$background"
            elevation={10}
          >
            <YStack padding="$6" borderBottomWidth={1} borderColor="$borderColor">
              <XStack alignItems="center" justifyContent="space-between">
                <Text fontSize="$6" fontWeight="600" color="$color12">
                  Shopping Cart
                </Text>
                <Button
                  onPress={() => setShowCart(false)}
                  variant="ghost"
                  size="$3"
                >
                  ×
                </Button>
              </XStack>
            </YStack>
            <YStack padding="$6" flex={1}>
              <YStack gap="$4">
                <XStack
                  alignItems="center"
                  justifyContent="space-between"
                  padding="$3"
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$4"
                >
                  <YStack>
                    <Text fontWeight="500">General Liability</Text>
                    <SizableText size="$3" color="$color11">
                      State Farm
                    </SizableText>
                  </YStack>
                  <Text fontWeight="700">$2,400/yr</Text>
                </XStack>
                <XStack
                  alignItems="center"
                  justifyContent="space-between"
                  padding="$3"
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$4"
                >
                  <YStack>
                    <Text fontWeight="500">Workers Compensation</Text>
                    <SizableText size="$3" color="$color11">
                      Travelers
                    </SizableText>
                  </YStack>
                  <Text fontWeight="700">$3,200/yr</Text>
                </XStack>
              </YStack>
              <YStack mt="$6" paddingTop="$4" borderTopWidth={1} borderColor="$borderColor">
                <XStack alignItems="center" justifyContent="space-between">
                  <Text fontSize="$6" fontWeight="700">
                    Total:
                  </Text>
                  <Text fontSize="$6" fontWeight="700">
                    $5,600/yr
                  </Text>
                </XStack>
                <Button
                  flex={1}
                  size="$5"
                  variant="primary"
                  mt="$4"
                >
                  Proceed to Checkout
                </Button>
              </YStack>
            </YStack>
          </XStack>
        </XStack>
      )}

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <Card
          backgroundColor="$background"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$borderColor"
          padding="$12"
          alignItems="center"
        >
          <Search size={48} color="$color6" mb="$4" />
          <Text fontSize="$6" fontWeight="500" color="$color12" mb="$2">
            No insurance products found
          </Text>
          <SizableText color="$color11">
            Try adjusting your search terms or category filters
          </SizableText>
        </Card>
      )}
    </YStack>
  );
}
