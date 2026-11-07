export const en = {
  appName: 'HisabKhata',
  appTagline: 'Simple Bookkeeping for Small Businesses',
  brandName: 'HisabKhata',
  
  nav: {
    dashboard: 'Dashboard',
    products: 'Products & Stock',
    sales: 'Sales & Ledger',
    customers: 'Customers',
    dueManagement: 'Credit & Due Ledger',
    reports: 'Reports & Statements',
    settings: 'Settings',
    phaseBadge: 'Phase 01',
    futureBadge: 'Upcoming'
  },

  header: {
    searchPlaceholder: 'Search products, customers, or phone...',
    currentStore: 'M/S Rahim Traders',
    storeLocation: 'Chawkbazar, Dhaka',
    storeOwner: 'Abdur Rahim',
    ownerRole: 'Proprietor',
    themeLight: 'Light Mode',
    themeDark: 'Dark Mode',
    switchToEnglish: 'English',
    switchToBengali: 'বাংলা',
    profile: 'Store Profile',
    loginBtn: 'Sign In / Register',
    logoutBtn: 'Log Out',
    guestUser: 'Guest Mode'
  },

  auth: {
    modalTitle: 'Access Your Business Ledger',
    loginTab: 'Sign In',
    registerTab: 'New Account',
    fullNameLabel: 'Full Name',
    fullNamePlaceholder: 'e.g. Haji Abdul Karim',
    emailLabel: 'Email Address',
    emailPlaceholder: 'name@business.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Minimum 8 characters',
    confirmPasswordLabel: 'Confirm Password',
    confirmPasswordPlaceholder: 'Re-enter your password',
    loginSubmitBtn: 'Sign In',
    registerSubmitBtn: 'Create Account',
    processing: 'Processing...',
    passwordMismatch: 'Passwords must match exactly.',
    passwordTooShort: 'Password must be at least 8 characters.',
    fullNameRequired: 'Full name is required.',
    emailInvalid: 'Please enter a valid email address.',
    welcomeBack: 'Welcome back! You have logged in successfully.',
    registrationSuccess: 'Your business account has been created.',
    loggedOut: 'Logged out successfully.',
    authNotice: 'Phase 03: Session and User Authentication Active.'
  },

  products: {
    title: 'Product & Stock Management',
    subtitle: 'Catalogue of store inventory, wholesale/retail pricing, and stock balance',
    addProductBtn: 'Add Product',
    editProductBtn: 'Edit Product',
    searchPlaceholder: 'Search by product name or code...',
    allCategories: 'All Categories',
    filterActive: 'Active Products',
    filterArchived: 'Archived',
    filterAll: 'All Products',
    
    // Stats
    totalProducts: 'Total Products',
    lowStockAlerts: 'Low Stock Alerts',
    totalInventoryValue: 'Total Stock Value (Cost)',
    
    // Table Headers
    colProduct: 'Product & Code',
    colCategory: 'Category',
    colUnit: 'Unit',
    colPurchasePrice: 'Purchase Price',
    colSellingPrice: 'Selling Price',
    colStock: 'Current Stock',
    colStatus: 'Status',
    colActions: 'Actions',
    
    // Status
    statusInStock: 'In Stock',
    statusLowStock: 'Low Stock',
    statusOutOfStock: 'Out of Stock',
    statusArchived: 'Archived',
    
    // Actions
    edit: 'Edit',
    archive: 'Archive',
    restore: 'Restore',
    confirmArchive: 'Are you sure you want to archive this product?',
    confirmRestore: 'Are you sure you want to restore this product?',
    
    // Modal Form
    modalAddTitle: 'Add New Product',
    modalEditTitle: 'Update Product Details',
    nameLabel: 'Product Name *',
    namePlaceholder: 'e.g. Miniket Rice (50kg Bag)',
    codeLabel: 'Product Code / SKU',
    codePlaceholder: 'e.g. RICE-01',
    categoryLabel: 'Category',
    categoryPlaceholder: 'e.g. Groceries & Staples',
    unitLabel: 'Unit of Measure',
    purchasePriceLabel: 'Purchase Price (৳)',
    sellingPriceLabel: 'Selling Price (৳)',
    stockQuantityLabel: 'Opening / Current Stock',
    lowStockThresholdLabel: 'Low Stock Alert Threshold',
    saveBtn: 'Save Product',
    savingBtn: 'Saving...',
    cancelBtn: 'Cancel',
    
    // Units
    unit_piece: 'Piece',
    unit_kg: 'Kg',
    unit_gram: 'Gram',
    unit_litre: 'Litre',
    unit_ml: 'ml',
    unit_box: 'Box / Carton',
    unit_packet: 'Packet',
    unit_dozen: 'Dozen',
    unit_meter: 'Meter',
    unit_other: 'Other',
    
    // Empty & Auth
    emptyState: 'No products found',
    emptyStateSub: 'Click the "Add Product" button above to add your first item to inventory.',
    authRequiredTitle: 'Sign In to View Products',
    authRequiredText: 'Please log in to your account to view and manage your private product catalogue.'
  },

  customers: {
    title: 'Customer Directory',
    subtitle: 'Registered business customers, phone numbers, and delivery addresses',
    addCustomerBtn: 'Add Customer',
    editCustomerBtn: 'Edit',
    viewDetailsBtn: 'View Details',
    searchPlaceholder: 'Search by customer name, phone, or address...',
    filterActive: 'Active Customers',
    filterArchived: 'Archived',
    filterAll: 'All Customers',
    
    // Stats
    totalCustomers: 'Total Customers',
    activeCustomers: 'Active Accounts',
    archivedCustomers: 'Archived Accounts',
    
    // Table Headers
    colCustomer: 'Customer Name',
    colPhone: 'Phone Number',
    colAddress: 'Address',
    colStatus: 'Status',
    colActions: 'Actions',
    
    // Status
    statusActive: 'Active',
    statusArchived: 'Archived',
    
    // Actions
    edit: 'Edit',
    archive: 'Archive',
    restore: 'Restore',
    confirmArchive: 'Are you sure you want to archive this customer profile?',
    confirmRestore: 'Are you sure you want to restore this customer profile?',
    
    // Modal Form
    modalAddTitle: 'Add New Customer',
    modalEditTitle: 'Update Customer Information',
    nameLabel: 'Customer Full Name *',
    namePlaceholder: 'e.g. Haji Mohammad Ali',
    phoneLabel: 'Phone Number *',
    phonePlaceholder: 'e.g. 01712-345678',
    phoneHint: 'Enter 11-digit Bangladeshi number or international format (+880...)',
    addressLabel: 'Shop / Delivery Address',
    addressPlaceholder: 'e.g. 14 Chowk Circular Road, Dhaka',
    nidLabel: 'National ID (NID) (Optional)',
    nidPlaceholder: 'e.g. 19852691234567890',
    nidSecurityNotice: 'NID is sensitive personal information. It is kept strictly confidential, accessible only to you, and never displayed in public lists.',
    notesLabel: 'Internal Notes / Reference (Optional)',
    notesPlaceholder: 'e.g. Referred by New Market Traders Association...',
    saveBtn: 'Save Customer',
    savingBtn: 'Saving...',
    cancelBtn: 'Cancel',
    
    // Detail Modal
    detailTitle: 'Customer Profile',
    personalInfo: 'Contact Information',
    nidField: 'National ID (NID)',
    nidNotProvided: 'Not Provided',
    notesField: 'Internal Notes',
    noNotes: 'No notes on file for this customer.',
    registeredOn: 'Registered Date',
    lastUpdated: 'Last Updated',
    
    // Empty & Auth
    emptyState: 'No customers found',
    emptyStateSub: 'Click the "Add Customer" button above to register your first business client.',
    authRequiredTitle: 'Sign In to View Customers',
    authRequiredText: 'Please log in to your account to view and manage your private customer directory.'
  },

  sales: {
    title: 'Sales & Transactions',
    subtitle: 'Record cash sales, track receipts, and manage sales history with live stock deduction',
    newSaleBtn: 'New Sale Voucher',
    viewDetailsBtn: 'View Voucher',
    searchPlaceholder: 'Search by voucher #, customer name, phone, or product...',
    allDates: 'All Dates',
    today: 'Today',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    
    // Stats
    totalSales: 'Total Sales Vouchers',
    totalRevenue: 'Total Revenue',
    cashReceived: 'Cash Collected',
    
    // Table Headers
    colInvoice: 'Voucher #',
    colDate: 'Date & Time',
    colCustomer: 'Customer',
    colItems: 'Items',
    colTotal: 'Total (৳)',
    colPayment: 'Payment',
    colActions: 'Actions',
    
    // Payment badge & types
    paymentCash: 'Cash',
    paymentTypeLabel: 'Payment Option',
    paymentTypeCash: 'Full Payment (Immediate)',
    paymentTypeCredit: 'Credit Sale (Full Due)',
    paymentTypePartial: 'Partial Payment',
    initialPaymentLabel: 'Paid Now (৳)',
    remainingDueLabel: 'Remaining Due (৳)',
    customerRequiredForCredit: 'A registered customer is required when recording a credit or partially paid sale.',
    statusPaid: 'Paid',
    statusPartial: 'Partial Due',
    statusDue: 'Unpaid Due',
    filterAllPayments: 'All Payments',
    filterPaid: 'Paid in Full',
    filterPartial: 'Partial Dues',
    filterDue: 'Unpaid Dues',
    colPaid: 'Paid (৳)',
    colDue: 'Due (৳)',
    collectDueBtn: 'Collect Due',
    paymentHistory: 'Payment History',
    noPaymentsRecorded: 'No separate payments recorded for this sale.',
    method_cash: 'Cash',
    method_bkash: 'bKash',
    method_nagad: 'Nagad',
    method_rocket: 'Rocket',
    method_bank_transfer: 'Bank Transfer',
    
    // Form Modal
    modalTitle: 'Create Sales Voucher',
    selectCustomer: 'Select Customer (Optional for cash sales)',
    walkInCustomer: 'Walk-in / Cash Customer',
    addItemBtn: 'Add Product Line',
    selectProductPlaceholder: 'Select a product...',
    availableStock: 'Avail:',
    qtyLabel: 'Qty',
    priceLabel: 'Price (৳)',
    totalLabel: 'Line Total (৳)',
    grandTotal: 'Grand Total',
    paymentMethodNotice: 'Customer dues and partial payments are securely recorded in the ledger.',
    notesLabel: 'Voucher Notes / Reference (Optional)',
    notesPlaceholder: 'e.g. Counter sale, special packaging...',
    submitSaleBtn: 'Confirm & Complete Sale',
    submittingSale: 'Processing Sale & Stock...',
    cancelBtn: 'Cancel',
    outOfStockNotice: 'Insufficient inventory stock',
    noItemsAlert: 'Please select at least one product with quantity greater than zero.',
    
    // Detail Modal
    detailTitle: 'Sales Voucher Details',
    voucherSummary: 'Voucher Summary',
    customerInfo: 'Customer Information',
    itemBreakdown: 'Itemised Product Lines',
    colProduct: 'Product Name',
    colCode: 'Code',
    colUnitPrice: 'Price (৳)',
    colQty: 'Qty',
    colLineTotal: 'Total (৳)',
    subtotalLabel: 'Subtotal',
    discountLabel: 'Discount',
    grandTotalLabel: 'Grand Total',
    paidAmountLabel: 'Amount Paid',
    dueAmountLabel: 'Remaining Due',
    paymentStatusLabel: 'Payment Status',
    paymentMethodLabel: 'Payment Method',
    notesLabelDetail: 'Voucher Remarks',
    noNotes: 'No remarks recorded for this sale.',
    
    // Empty & Auth
    emptyState: 'No sales recorded yet',
    emptyStateSub: 'Click the "New Sale Voucher" button above to record your first store transaction.',
    authRequiredTitle: 'Sign In to View Sales History',
    authRequiredText: 'Sales data and stock adjustments are private. Please sign in to access your sales register.'
  },

  dues: {
    title: 'Customer Dues & Ledger',
    subtitle: 'Track outstanding balances, collect dues against invoices, and review payment ledgers',
    totalDue: 'Total Outstanding Dues',
    customersWithDue: 'Customers with Due',
    unpaidVouchers: 'Unpaid Invoices',
    searchPlaceholder: 'Search customer by name, phone, or address...',
    filterAll: 'All Customers with Due',
    
    // Table Headers
    colCustomer: 'Customer Name',
    colPhone: 'Phone',
    colUnpaidCount: 'Unpaid Invoices',
    colTotalPurchases: 'Total Purchases (৳)',
    colTotalPaid: 'Paid (৳)',
    colTotalDue: 'Outstanding Due (৳)',
    colActions: 'Actions',
    
    // Actions
    collectDueBtn: 'Collect Due',
    viewStatementBtn: 'View Statement',
    
    // Collect Due Modal
    modalCollectTitle: 'Collect Customer Due',
    voucherInfo: 'Voucher Information',
    voucherNumber: 'Voucher #',
    customerName: 'Customer',
    saleGrandTotal: 'Voucher Total',
    salePaidAmount: 'Already Paid',
    currentDue: 'Outstanding Balance',
    collectAmountLabel: 'Payment Amount to Collect (৳) *',
    collectAmountPlaceholder: 'Enter amount in BDT (৳)',
    paymentMethodLabel: 'Collection Method',
    paymentNotesLabel: 'Receipt / Reference Note (Optional)',
    paymentNotesPlaceholder: 'e.g. Cash in counter, TrxID: 9X82...',
    submitPaymentBtn: 'Confirm & Record Payment',
    processingPayment: 'Recording Payment in Ledger...',
    cancelBtn: 'Cancel',
    
    // Statement Modal
    statementTitle: 'Customer Due Statement & History',
    summaryTab: 'Overview Statement',
    unpaidInvoicesTab: 'Unpaid Invoices',
    paymentLedgerTab: 'Payment Receipts',
    allInvoicesTab: 'All Purchases',
    noUnpaidInvoices: 'All invoices for this customer are fully settled.',
    noPayments: 'No payment receipts recorded yet.',
    colReceiptNo: 'Receipt #',
    colPaidAt: 'Date & Time',
    colMethod: 'Method',
    colAmount: 'Amount (৳)',
    colVoucherRef: 'Voucher Ref',
    
    // Empty & Auth
    emptyState: 'No outstanding customer dues',
    emptyStateSub: 'All customer balances are currently clear and settled.',
    authRequiredTitle: 'Sign In to View Customer Dues',
    authRequiredText: 'Customer accounts and balances are private. Please log in to view receivables.'
  },

  dashboard: {
    title: 'Dashboard Overview',
    subtitle: "Today's financial snapshot and business health",
    demoDataNotice: 'Sample Data — Displayed for Phase 01 design system preview.',
    demoDataBadge: 'Demo Data',
    lastUpdated: 'Last synchronized: Today at 12:45 PM',
    
    // KPI Cards
    todaySales: "Today's Sales",
    todaySalesSub: '+15.2% compared to yesterday',
    cashCollected: 'Cash Collected Today',
    cashCollectedSub: 'Direct cash in register & drawer',
    newCredit: 'New Credit Today',
    newCreditSub: 'Added to 4 customer balance sheets',
    totalOutstanding: 'Total Outstanding Dues',
    totalOutstandingSub: 'Pending across 18 customer ledgers',

    // Quick Actions
    quickActions: 'Quick Actions',
    newSaleBtn: 'New Sale Entry',
    newSaleDesc: 'Record cash or credit sale entry',
    collectDueBtn: 'Collect Due',
    collectDueDesc: 'Record payment against customer balance',
    addCustomerBtn: 'New Customer',
    addCustomerDesc: 'Open new customer ledger profile',
    addProductBtn: 'Add Product',
    addProductDesc: 'Update price, category & initial stock',

    // Recent Transactions
    recentActivityTitle: "Today's Recent Transactions",
    recentActivitySub: 'Live ledger of cash sales, credit sales, and due receipts',
    filterAll: 'All Transactions',
    filterCashSale: 'Cash Sales',
    filterCreditSale: 'Credit Sales',
    filterDueCollection: 'Due Receipts',
    searchTable: 'Search by customer name or phone...',
    
    // Table Headers
    colTime: 'Time & ID',
    colCustomer: 'Customer & Phone',
    colItems: 'Item Summary / Note',
    colType: 'Transaction Type',
    colAmount: 'Amount',
    colStatus: 'Status',

    // Statuses
    typeCashSale: 'Cash Sale',
    typeCreditSale: 'Credit Sale',
    typeDueCollection: 'Due Receipt',
    statusPaid: 'Paid in Cash',
    statusDue: 'Outstanding Due',
    statusCollected: 'Collection Done',
    emptyTable: 'No matching transaction records found',
    totalCount: 'Total transactions:',

    // High Dues Widget
    highDueTitle: 'High Priority Overdue Dues',
    highDueSub: 'Balances pending for more than 15 days',
    sendReminder: 'SMS Reminder',
    viewAllDue: 'View Full Due Ledger'
  },

  modal: {
    noticeTitle: 'Phase 01 Interface Preview',
    noticeText: 'You are previewing the Phase 01 design system for HisabKhata. Database storage, customer management, and transaction calculation will be implemented in Phase 02.',
    actionNotice: 'This action workflow is scheduled for Phase 02.',
    closeBtn: 'Understood'
  },

  footer: {
    rights: 'HisabKhata — Trusted business bookkeeping for retail and wholesale',
    phase: 'Phase 01: Frontend Foundation & Design System'
  }
};
