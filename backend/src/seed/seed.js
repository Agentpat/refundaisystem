import "dotenv/config";

import connectDatabase from "../config/database.js";

import Customer from "../models/Customer.js";
import Order from "../models/Order.js";
import RefundPolicy from "../models/RefundPolicy.js";

const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const customers = [
  {
    customerId: "CUS-1001",
    firstName: "Daniel",
    lastName: "Carter",
    email: "daniel.carter@example.com",
    phone: "+1-202-555-0101",
    accountStatus: "ACTIVE",
  },
  {
    customerId: "CUS-1002",
    firstName: "Sarah",
    lastName: "Mitchell",
    email: "sarah.mitchell@example.com",
    phone: "+1-202-555-0102",
    accountStatus: "ACTIVE",
  },
  {
    customerId: "CUS-1003",
    firstName: "Michael",
    lastName: "Brown",
    email: "michael.brown@example.com",
    phone: "+1-202-555-0103",
    accountStatus: "ACTIVE",
  },
  {
    customerId: "CUS-1004",
    firstName: "Emily",
    lastName: "Johnson",
    email: "emily.johnson@example.com",
    phone: "+1-202-555-0104",
    accountStatus: "ACTIVE",
  },
  {
    customerId: "CUS-1005",
    firstName: "James",
    lastName: "Wilson",
    email: "james.wilson@example.com",
    phone: "+1-202-555-0105",
    accountStatus: "ACTIVE",
  },
  {
    customerId: "CUS-1006",
    firstName: "Olivia",
    lastName: "Davis",
    email: "olivia.davis@example.com",
    phone: "+1-202-555-0106",
    accountStatus: "ACTIVE",
  },
  {
    customerId: "CUS-1007",
    firstName: "William",
    lastName: "Taylor",
    email: "william.taylor@example.com",
    phone: "+1-202-555-0107",
    accountStatus: "ACTIVE",
  },
  {
    customerId: "CUS-1008",
    firstName: "Sophia",
    lastName: "Anderson",
    email: "sophia.anderson@example.com",
    phone: "+1-202-555-0108",
    accountStatus: "ACTIVE",
  },
  {
    customerId: "CUS-1009",
    firstName: "Benjamin",
    lastName: "Thomas",
    email: "benjamin.thomas@example.com",
    phone: "+1-202-555-0109",
    accountStatus: "ACTIVE",
  },
  {
    customerId: "CUS-1010",
    firstName: "Isabella",
    lastName: "Moore",
    email: "isabella.moore@example.com",
    phone: "+1-202-555-0110",
    accountStatus: "ACTIVE",
  },
  {
    customerId: "CUS-1011",
    firstName: "Lucas",
    lastName: "Martin",
    email: "lucas.martin@example.com",
    phone: "+1-202-555-0111",
    accountStatus: "ACTIVE",
  },
  {
    customerId: "CUS-1012",
    firstName: "Mia",
    lastName: "Jackson",
    email: "mia.jackson@example.com",
    phone: "+1-202-555-0112",
    accountStatus: "ACTIVE",
  },
  {
    customerId: "CUS-1013",
    firstName: "Henry",
    lastName: "White",
    email: "henry.white@example.com",
    phone: "+1-202-555-0113",
    accountStatus: "ACTIVE",
  },
  {
    customerId: "CUS-1014",
    firstName: "Ava",
    lastName: "Harris",
    email: "ava.harris@example.com",
    phone: "+1-202-555-0114",
    accountStatus: "ACTIVE",
  },
  {
    customerId: "CUS-1015",
    firstName: "Noah",
    lastName: "Clark",
    email: "noah.clark@example.com",
    phone: "+1-202-555-0115",
    accountStatus: "ACTIVE",
  },
];

const createOrders = (savedCustomers) => {
  const customerMap = Object.fromEntries(
    savedCustomers.map((customer) => [customer.customerId, customer._id]),
  );

  return [
    /*
    ============================================================
    CUSTOMER 1001 — DANIEL CARTER
    Normal eligible order
    ============================================================
    */

    {
      orderId: "ORD-1001",
      customerId: customerMap["CUS-1001"],
      items: [
        {
          productId: "PROD-001",
          name: "Wireless Headphones",
          quantity: 1,
          unitPrice: 120,
          finalSale: false,
        },
      ],
      totalAmount: 120,
      currency: "USD",
      status: "DELIVERED",
      orderDate: daysAgo(7),
      refundedAmount: 0,
    },

    {
      orderId: "ORD-1002",
      customerId: customerMap["CUS-1001"],
      items: [
        {
          productId: "PROD-016",
          name: "Laptop Sleeve",
          quantity: 1,
          unitPrice: 45,
          finalSale: false,
        },
        {
          productId: "PROD-017",
          name: "Wireless Mouse",
          quantity: 1,
          unitPrice: 65,
          finalSale: false,
        },
      ],
      totalAmount: 110,
      currency: "USD",
      status: "DELIVERED",
      orderDate: daysAgo(14),
      refundedAmount: 0,
    },

    /*
    ============================================================
    CUSTOMER 1002 — SARAH MITCHELL
    Damaged item + high value order
    ============================================================
    */

    {
      orderId: "ORD-1003",
      customerId: customerMap["CUS-1002"],
      items: [
        {
          productId: "PROD-002",
          name: "Mechanical Keyboard",
          quantity: 1,
          unitPrice: 180,
          finalSale: false,
        },
      ],
      totalAmount: 180,
      currency: "USD",
      status: "DELIVERED",
      orderDate: daysAgo(10),
      refundedAmount: 0,
    },

    {
      orderId: "ORD-1004",
      customerId: customerMap["CUS-1002"],
      items: [
        {
          productId: "PROD-003",
          name: "4K Professional Monitor",
          quantity: 1,
          unitPrice: 650,
          finalSale: false,
        },
      ],
      totalAmount: 650,
      currency: "USD",
      status: "DELIVERED",
      orderDate: daysAgo(8),
      refundedAmount: 0,
    },

    /*
    ============================================================
    CUSTOMER 1003 — MICHAEL BROWN
    Final sale + old order
    ============================================================
    */

    {
      orderId: "ORD-1005",
      customerId: customerMap["CUS-1003"],
      items: [
        {
          productId: "PROD-004",
          name: "USB-C Dock",
          quantity: 1,
          unitPrice: 95,
          finalSale: true,
        },
      ],
      totalAmount: 95,
      currency: "USD",
      status: "DELIVERED",
      orderDate: daysAgo(5),
      refundedAmount: 0,
    },

    {
      orderId: "ORD-1006",
      customerId: customerMap["CUS-1003"],
      items: [
        {
          productId: "PROD-005",
          name: "Premium Office Chair",
          quantity: 1,
          unitPrice: 320,
          finalSale: false,
        },
      ],
      totalAmount: 320,
      currency: "USD",
      status: "DELIVERED",
      orderDate: daysAgo(45),
      refundedAmount: 0,
    },

    /*
    ============================================================
    CUSTOMER 1004 — EMILY JOHNSON
    Normal + incorrect item
    ============================================================
    */

    {
      orderId: "ORD-1007",
      customerId: customerMap["CUS-1004"],
      items: [
        {
          productId: "PROD-006",
          name: "Laptop Stand",
          quantity: 1,
          unitPrice: 75,
          finalSale: false,
        },
      ],
      totalAmount: 75,
      currency: "USD",
      status: "DELIVERED",
      orderDate: daysAgo(12),
      refundedAmount: 0,
    },

    {
      orderId: "ORD-1008",
      customerId: customerMap["CUS-1004"],
      items: [
        {
          productId: "PROD-007",
          name: "USB-C Hub",
          quantity: 1,
          unitPrice: 90,
          finalSale: false,
        },
        {
          productId: "PROD-018",
          name: "HDMI Cable",
          quantity: 2,
          unitPrice: 20,
          finalSale: false,
        },
      ],
      totalAmount: 130,
      currency: "USD",
      status: "DELIVERED",
      orderDate: daysAgo(6),
      refundedAmount: 0,
    },

    /*
    ============================================================
    CUSTOMER 1005 — JAMES WILSON
    High value + multiple items
    ============================================================
    */

    {
      orderId: "ORD-1009",
      customerId: customerMap["CUS-1005"],
      items: [
        {
          productId: "PROD-008",
          name: "Professional Camera",
          quantity: 1,
          unitPrice: 899,
          finalSale: false,
        },
      ],
      totalAmount: 899,
      currency: "USD",
      status: "DELIVERED",
      orderDate: daysAgo(6),
      refundedAmount: 0,
    },

    {
      orderId: "ORD-1010",
      customerId: customerMap["CUS-1005"],
      items: [
        {
          productId: "PROD-019",
          name: "Camera Tripod",
          quantity: 1,
          unitPrice: 140,
          finalSale: false,
        },
        {
          productId: "PROD-020",
          name: "Camera Bag",
          quantity: 1,
          unitPrice: 90,
          finalSale: false,
        },
      ],
      totalAmount: 230,
      currency: "USD",
      status: "DELIVERED",
      orderDate: daysAgo(18),
      refundedAmount: 0,
    },

    /*
    ============================================================
    CUSTOMER 1006 — OLIVIA DAVIS
    Normal + already refunded
    ============================================================
    */

    {
      orderId: "ORD-1011",
      customerId: customerMap["CUS-1006"],
      items: [
        {
          productId: "PROD-009",
          name: "Bluetooth Speaker",
          quantity: 1,
          unitPrice: 140,
          finalSale: false,
        },
      ],
      totalAmount: 140,
      currency: "USD",
      status: "DELIVERED",
      orderDate: daysAgo(20),
      refundedAmount: 0,
    },

    {
      orderId: "ORD-1012",
      customerId: customerMap["CUS-1006"],
      items: [
        {
          productId: "PROD-010",
          name: "Wireless Charging Station",
          quantity: 1,
          unitPrice: 85,
          finalSale: false,
        },
      ],
      totalAmount: 85,
      currency: "USD",
      status: "REFUNDED",
      orderDate: daysAgo(9),
      refundedAmount: 85,
    },

    /*
    ============================================================
    CUSTOMER 1007 — WILLIAM TAYLOR
    Large refund + normal order
    ============================================================
    */

    {
      orderId: "ORD-1013",
      customerId: customerMap["CUS-1007"],
      items: [
        {
          productId: "PROD-011",
          name: "Mac-Compatible Display",
          quantity: 1,
          unitPrice: 720,
          finalSale: false,
        },
      ],
      totalAmount: 720,
      currency: "USD",
      status: "DELIVERED",
      orderDate: daysAgo(11),
      refundedAmount: 0,
    },

    {
      orderId: "ORD-1014",
      customerId: customerMap["CUS-1007"],
      items: [
        {
          productId: "PROD-012",
          name: "Desk Mat",
          quantity: 1,
          unitPrice: 35,
          finalSale: false,
        },
      ],
      totalAmount: 35,
      currency: "USD",
      status: "DELIVERED",
      orderDate: daysAgo(4),
      refundedAmount: 0,
    },

    /*
    ============================================================
    CUSTOMER 1008 — SOPHIA ANDERSON
    Old order + normal order
    ============================================================
    */

    {
      orderId: "ORD-1015",
      customerId: customerMap["CUS-1008"],
      items: [
        {
          productId: "PROD-013",
          name: "Tablet",
          quantity: 1,
          unitPrice: 450,
          finalSale: false,
        },
      ],
      totalAmount: 450,
      currency: "USD",
      status: "DELIVERED",
      orderDate: daysAgo(25),
      refundedAmount: 0,
    },

    {
      orderId: "ORD-1016",
      customerId: customerMap["CUS-1008"],
      items: [
        {
          productId: "PROD-014",
          name: "Smart Watch",
          quantity: 1,
          unitPrice: 260,
          finalSale: false,
        },
      ],
      totalAmount: 260,
      currency: "USD",
      status: "DELIVERED",
      orderDate: daysAgo(35),
      refundedAmount: 0,
    },

    /*
    ============================================================
    CUSTOMER 1009 — BENJAMIN THOMAS
    Normal + damaged item
    ============================================================
    */

    {
      orderId: "ORD-1017",
      customerId: customerMap["CUS-1009"],
      items: [
        {
          productId: "PROD-015",
          name: "Gaming Mouse",
          quantity: 1,
          unitPrice: 85,
          finalSale: false,
        },
      ],
      totalAmount: 85,
      currency: "USD",
      status: "DELIVERED",
      orderDate: daysAgo(3),
      refundedAmount: 0,
    },

    {
      orderId: "ORD-1018",
      customerId: customerMap["CUS-1009"],
      items: [
        {
          productId: "PROD-021",
          name: "Gaming Monitor",
          quantity: 1,
          unitPrice: 480,
          finalSale: false,
        },
      ],
      totalAmount: 480,
      currency: "USD",
      status: "DELIVERED",
      orderDate: daysAgo(9),
      refundedAmount: 0,
    },

    /*
    ============================================================
    CUSTOMER 1010 — ISABELLA MOORE
    Multi-item order
    ============================================================
    */

    {
      orderId: "ORD-1019",
      customerId: customerMap["CUS-1010"],
      items: [
        {
          productId: "PROD-022",
          name: "Webcam",
          quantity: 1,
          unitPrice: 110,
          finalSale: false,
        },
        {
          productId: "PROD-023",
          name: "USB Microphone",
          quantity: 1,
          unitPrice: 160,
          finalSale: false,
        },
        {
          productId: "PROD-024",
          name: "Microphone Stand",
          quantity: 1,
          unitPrice: 55,
          finalSale: false,
        },
      ],
      totalAmount: 325,
      currency: "USD",
      status: "DELIVERED",
      orderDate: daysAgo(15),
      refundedAmount: 0,
    },

    {
      orderId: "ORD-1020",
      customerId: customerMap["CUS-1010"],
      items: [
        {
          productId: "PROD-025",
          name: "USB-C Cable",
          quantity: 3,
          unitPrice: 18,
          finalSale: false,
        },
      ],
      totalAmount: 54,
      currency: "USD",
      status: "DELIVERED",
      orderDate: daysAgo(7),
      refundedAmount: 0,
    },

    /*
    ============================================================
    CUSTOMER 1011 — LUCAS MARTIN
    Old + high value
    ============================================================
    */

    {
      orderId: "ORD-1021",
      customerId: customerMap["CUS-1011"],
      items: [
        {
          productId: "PROD-026",
          name: "Tablet Pro",
          quantity: 1,
          unitPrice: 580,
          finalSale: false,
        },
      ],
      totalAmount: 580,
      currency: "USD",
      status: "DELIVERED",
      orderDate: daysAgo(28),
      refundedAmount: 0,
    },

    {
      orderId: "ORD-1022",
      customerId: customerMap["CUS-1011"],
      items: [
        {
          productId: "PROD-027",
          name: "External Hard Drive",
          quantity: 1,
          unitPrice: 125,
          finalSale: false,
        },
      ],
      totalAmount: 125,
      currency: "USD",
      status: "DELIVERED",
      orderDate: daysAgo(42),
      refundedAmount: 0,
    },

    /*
    ============================================================
    CUSTOMER 1012 — MIA JACKSON
    Final sale + normal
    ============================================================
    */

    {
      orderId: "ORD-1023",
      customerId: customerMap["CUS-1012"],
      items: [
        {
          productId: "PROD-028",
          name: "Clearance Keyboard",
          quantity: 1,
          unitPrice: 60,
          finalSale: true,
        },
      ],
      totalAmount: 60,
      currency: "USD",
      status: "DELIVERED",
      orderDate: daysAgo(4),
      refundedAmount: 0,
    },

    {
      orderId: "ORD-1024",
      customerId: customerMap["CUS-1012"],
      items: [
        {
          productId: "PROD-029",
          name: "Desk Lamp",
          quantity: 1,
          unitPrice: 70,
          finalSale: false,
        },
      ],
      totalAmount: 70,
      currency: "USD",
      status: "DELIVERED",
      orderDate: daysAgo(13),
      refundedAmount: 0,
    },

    /*
    ============================================================
    CUSTOMER 1013 — HENRY WHITE
    Cancelled + delivered
    ============================================================
    */

    {
      orderId: "ORD-1025",
      customerId: customerMap["CUS-1013"],
      items: [
        {
          productId: "PROD-030",
          name: "Office Desk",
          quantity: 1,
          unitPrice: 410,
          finalSale: false,
        },
      ],
      totalAmount: 410,
      currency: "USD",
      status: "CANCELLED",
      orderDate: daysAgo(5),
      refundedAmount: 0,
    },

    {
      orderId: "ORD-1026",
      customerId: customerMap["CUS-1013"],
      items: [
        {
          productId: "PROD-031",
          name: "Ergonomic Footrest",
          quantity: 1,
          unitPrice: 65,
          finalSale: false,
        },
      ],
      totalAmount: 65,
      currency: "USD",
      status: "DELIVERED",
      orderDate: daysAgo(8),
      refundedAmount: 0,
    },

    /*
    ============================================================
    CUSTOMER 1014 — AVA HARRIS
    High value multi-item
    ============================================================
    */

    {
      orderId: "ORD-1027",
      customerId: customerMap["CUS-1014"],
      items: [
        {
          productId: "PROD-032",
          name: "Ultrawide Monitor",
          quantity: 1,
          unitPrice: 550,
          finalSale: false,
        },
        {
          productId: "PROD-033",
          name: "Monitor Arm",
          quantity: 1,
          unitPrice: 130,
          finalSale: false,
        },
      ],
      totalAmount: 680,
      currency: "USD",
      status: "DELIVERED",
      orderDate: daysAgo(16),
      refundedAmount: 0,
    },

    {
      orderId: "ORD-1028",
      customerId: customerMap["CUS-1014"],
      items: [
        {
          productId: "PROD-034",
          name: "Keyboard Wrist Rest",
          quantity: 1,
          unitPrice: 30,
          finalSale: false,
        },
      ],
      totalAmount: 30,
      currency: "USD",
      status: "DELIVERED",
      orderDate: daysAgo(2),
      refundedAmount: 0,
    },

    /*
    ============================================================
    CUSTOMER 1015 — NOAH CLARK
    Potential suspicious/conflicting request scenarios
    ============================================================
    */

    {
      orderId: "ORD-1029",
      customerId: customerMap["CUS-1015"],
      items: [
        {
          productId: "PROD-035",
          name: "Premium Laptop",
          quantity: 1,
          unitPrice: 1450,
          finalSale: false,
        },
      ],
      totalAmount: 1450,
      currency: "USD",
      status: "DELIVERED",
      orderDate: daysAgo(12),
      refundedAmount: 0,
    },

    {
      orderId: "ORD-1030",
      customerId: customerMap["CUS-1015"],
      items: [
        {
          productId: "PROD-036",
          name: "Laptop Charger",
          quantity: 1,
          unitPrice: 90,
          finalSale: false,
        },
      ],
      totalAmount: 90,
      currency: "USD",
      status: "DELIVERED",
      orderDate: daysAgo(50),
      refundedAmount: 0,
    },
  ];
};

const seedDatabase = async () => {
  try {
    await connectDatabase();

    console.log("\nStarting database seed...\n");

    /*
    ------------------------------------------------------------
    CLEAR EXISTING DATA
    ------------------------------------------------------------
    */

    console.log("Clearing existing customers...");
    await Customer.deleteMany({});

    console.log("Clearing existing orders...");
    await Order.deleteMany({});

    console.log("Clearing existing refund policies...");
    await RefundPolicy.deleteMany({});

    /*
    ------------------------------------------------------------
    CUSTOMERS
    ------------------------------------------------------------
    */

    console.log("\nCreating customers...");

    const savedCustomers = await Customer.insertMany(customers);

    console.log(`✓ ${savedCustomers.length} customers created`);

    /*
    ------------------------------------------------------------
    ORDERS
    ------------------------------------------------------------
    */

    console.log("\nCreating orders...");

    const orders = createOrders(savedCustomers);

    const savedOrders = await Order.insertMany(orders);

    console.log(`✓ ${savedOrders.length} orders created`);

    /*
    ------------------------------------------------------------
    REFUND POLICY
    ------------------------------------------------------------
    */

    console.log("\nCreating refund policy...");

    const policy = await RefundPolicy.create({
      name: "Standard E-commerce Refund Policy",

      version: "1.0",

      refundWindowDays: 30,

      humanReviewThreshold: 500,

      finalSaleEligible: false,

      damagedItemEligible: true,

      incorrectItemEligible: true,

      active: true,
    });

    console.log(`✓ Policy "${policy.name}" v${policy.version} created`);

    /*
    ------------------------------------------------------------
    SUMMARY
    ------------------------------------------------------------
    */

    console.log("\n========================================");
    console.log("DATABASE SEED COMPLETED");
    console.log("========================================");

    console.log(`Customers: ${savedCustomers.length}`);
    console.log(`Orders: ${savedOrders.length}`);
    console.log("Policies: 1");

    console.log("\nTest scenarios available:");

    console.log("✓ Normal refund");
    console.log("✓ Damaged item");
    console.log("✓ Incorrect item");
    console.log("✓ Final-sale item");
    console.log("✓ Refund outside 30-day window");
    console.log("✓ Refund above $500");
    console.log("✓ Already refunded order");
    console.log("✓ Cancelled order");
    console.log("✓ Multi-item order");
    console.log("✓ Suspicious/high-value request");

    console.log("\nSeed finished successfully.\n");

    process.exit(0);
  } catch (error) {
    console.error("\nDatabase seed failed:");
    console.error(error);

    process.exit(1);
  }
};

seedDatabase();
