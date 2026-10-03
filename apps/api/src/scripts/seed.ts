import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const testUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'john@example.com' },
      update: {},
      create: {
        email: 'john@example.com',
        name: 'John Doe',
        password: hashedPassword,
        avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=random'
      }
    }),
    prisma.user.upsert({
      where: { email: 'jane@example.com' },
      update: {},
      create: {
        email: 'jane@example.com',
        name: 'Jane Smith',
        password: hashedPassword,
        avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=random'
      }
    })
  ]);

  console.log('✅ Created test users');

  // Create products
  const products = [
    // Electronics
    {
      name: "Pro Noise-Canceling Headphones",
      description: "Immerse yourself in music with industry-leading noise cancellation and 30-hour battery life.",
      price: 249.99,
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
      category: "electronics",
      inStock: true
    },
    {
      name: "Ultra-Slim 4K Monitor",
      description: "27-inch 4K UHD IPS monitor with ultra-thin bezels and sRGB 99% color gamut.",
      price: 399.99,
      imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80",
      category: "electronics",
      inStock: true
    },
    {
      name: "Mechanical Gaming Keyboard",
      description: "RGB backlit mechanical keyboard with tactile switches and aircraft-grade aluminum frame.",
      price: 129.99,
      imageUrl: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800&q=80",
      category: "electronics",
      inStock: true
    },
    {
      name: "Wireless Charging Dock",
      description: "3-in-1 wireless charging station for your phone, watch, and earbuds.",
      price: 59.99,
      imageUrl: "https://images.unsplash.com/photo-1615526675159-e248c3021d3f?w=800&q=80",
      category: "electronics",
      inStock: true
    },
    
    // Clothing & Fashion
    {
      name: "Premium Cotton Hoodie",
      description: "Heavyweight organic cotton hoodie with a relaxed fit. Perfect for everyday comfort.",
      price: 79.99,
      imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80",
      category: "clothing",
      inStock: true
    },
    {
      name: "Classic Denim Jacket",
      description: "Vintage-inspired denim jacket featuring durable stitching and timeless style.",
      price: 89.99,
      imageUrl: "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800&q=80",
      category: "clothing",
      inStock: true
    },
    {
      name: "Leather Weekend Bag",
      description: "Handcrafted full-grain leather bag, spacious enough for all your weekend getaway essentials.",
      price: 299.99,
      imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
      category: "accessories",
      inStock: true
    },
    {
      name: "Polarized Sunglasses",
      description: "Classic aviator style sunglasses with polarized lenses for 100% UV protection.",
      price: 149.99,
      imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80",
      category: "accessories",
      inStock: true
    },

    // Home & Lifestyle
    {
      name: "Minimalist Ceramic Vase",
      description: "Hand-thrown ceramic vase with a matte finish. A perfect centerpiece for any modern home.",
      price: 45.00,
      imageUrl: "https://picsum.photos/seed/ceramicvase/800/800",
      category: "home",
      inStock: true
    },
    {
      name: "Aromatic Soy Candle",
      description: "Hand-poured soy wax candle with essential oils. 50 hours of burn time.",
      price: 24.00,
      imageUrl: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&q=80",
      category: "home",
      inStock: true
    },
    {
      name: "Pour-Over Coffee Maker",
      description: "Glass coffee maker with a reusable stainless steel filter for the perfect brew.",
      price: 34.99,
      imageUrl: "https://images.unsplash.com/photo-1544097935-e5976425e7f9?w=800&q=80",
      category: "home",
      inStock: true
    },
    {
      name: "Smart LED Bulb Kit",
      description: "Pack of 4 color-changing smart bulbs compatible with voice assistants.",
      price: 49.99,
      imageUrl: "https://picsum.photos/seed/ledbulb/800/800",
      category: "home",
      inStock: true
    },

    // Beauty & Wellness
    {
      name: "Vitamin C Serum",
      description: "Brightening serum with 20% pure Vitamin C and Hyaluronic Acid.",
      price: 55.00,
      imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80",
      category: "beauty",
      inStock: true
    },
    {
      name: "Bamboo Toothbrush Set",
      description: "Eco-friendly pack of 4 biodegradable bamboo toothbrushes with charcoal bristles.",
      price: 12.99,
      imageUrl: "https://picsum.photos/seed/toothbrush/800/800",
      category: "beauty",
      inStock: true
    },

    // Sports & Outdoors
    {
      name: "Premium Yoga Mat",
      description: "Non-slip, eco-friendly yoga mat with alignment lines for perfect posture.",
      price: 65.00,
      imageUrl: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80",
      category: "sports",
      inStock: true
    },
    {
      name: "Insulated Water Bottle",
      description: "Double-wall vacuum insulated bottle keeps drinks cold for 24 hours.",
      price: 35.00,
      imageUrl: "https://picsum.photos/seed/waterbottle/800/800",
      category: "sports",
      inStock: true
    },
    {
      name: "Running Performance Shoes",
      description: "Lightweight running shoes with responsive cushioning and breathable mesh.",
      price: 119.99,
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
      category: "sports",
      inStock: true
    }
  ];

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.product.deleteMany({});
  
  const createdProducts = await Promise.all(
    products.map(product =>
      prisma.product.create({
        data: product
      })
    )
  );

  console.log(`✅ Created ${createdProducts.length} products`);

  // Create sample reviews
  const sampleReviews = [
    {
      userId: testUsers[0].id,
      productId: createdProducts[0].id,
      rating: 5,
      comment: "Absolutely love these headphones! The noise cancellation is a game changer."
    },
    {
      userId: testUsers[1].id,
      productId: createdProducts[0].id,
      rating: 4,
      comment: "Great sound, but a bit tight on the ears after a few hours."
    },
    {
      userId: testUsers[0].id,
      productId: createdProducts[1].id,
      rating: 5,
      comment: "Best monitor I've ever owned. The colors are incredibly accurate."
    },
    {
      userId: testUsers[1].id,
      productId: createdProducts[4].id, // Hoodie
      rating: 5,
      comment: "Super soft and fits perfectly. Will buy another color!"
    },
    {
      userId: testUsers[0].id,
      productId: createdProducts[8].id, // Vase
      rating: 5,
      comment: "Looks exactly like the picture. Very elegant."
    },
    {
      userId: testUsers[1].id,
      productId: createdProducts[16].id, // Running Shoes
      rating: 4,
      comment: "Very comfortable for running, but sizing runs a bit small."
    }
  ];

  await Promise.all(
    sampleReviews.map(review =>
      prisma.review.upsert({
        where: {
          userId_productId: {
            userId: review.userId,
            productId: review.productId
          }
        },
        update: {},
        create: review
      })
    )
  );

  console.log('✅ Created sample reviews');

  // Update product ratings based on reviews
  for (const product of createdProducts) {
    const avgRating = await prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: { rating: true }
    });

    if (avgRating._count.rating > 0) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          rating: avgRating._avg.rating || 0,
          reviewCount: avgRating._count.rating
        }
      });
    }
  }

  console.log('✅ Updated product ratings');

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
