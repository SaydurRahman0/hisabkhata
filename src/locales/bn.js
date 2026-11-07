export const bn = {
  appName: 'হিসাবখাতা',
  appTagline: 'ক্ষুদ্র ও মাঝারি ব্যবসার সহজ হিসাবরক্ষণ',
  brandName: 'HisabKhata',
  
  nav: {
    dashboard: 'ড্যাশবোর্ড',
    products: 'পণ্য ও স্টক',
    sales: 'বিক্রয় ও খাতা',
    customers: 'ক্রেতা তালিকা',
    dueManagement: 'বাকি ও দেনা-পাওনা',
    reports: 'রিপোর্ট ও বিবরণী',
    settings: 'সেটিংস',
    phaseBadge: 'ফেজ ০১',
    futureBadge: 'পরবর্তী ধাপ'
  },

  header: {
    searchPlaceholder: 'পণ্য, ক্রেতার নাম বা ফোন নম্বর খুঁজুন...',
    currentStore: 'মেসার্স রহিম ট্রেডার্স',
    storeLocation: 'চকবাজার, ঢাকা',
    storeOwner: 'আব্দুর রহিম',
    ownerRole: 'স্বত্বাধিকারী',
    themeLight: 'লাইট মোড',
    themeDark: 'ডার্ক মোড',
    switchToEnglish: 'English',
    switchToBengali: 'বাংলা',
    profile: 'দোকান প্রোফাইল',
    loginBtn: 'লগইন / নিবন্ধন',
    logoutBtn: 'লগআউট',
    guestUser: 'অতিথি মোড'
  },

  auth: {
    modalTitle: 'হিসাবখাতায় প্রবেশ করুন',
    loginTab: 'লগইন',
    registerTab: 'নতুন অ্যাকাউন্ট',
    fullNameLabel: 'আপনার পূর্ণ নাম',
    fullNamePlaceholder: 'উদা: হাজী আব্দুল করিম',
    emailLabel: 'ইমেইল অ্যাড্রেস',
    emailPlaceholder: 'name@business.com',
    passwordLabel: 'পাসওয়ার্ড',
    passwordPlaceholder: 'কমপক্ষে ৮ অক্ষরের পাসওয়ার্ড',
    confirmPasswordLabel: 'পাসওয়ার্ড নিশ্চিত করুন',
    confirmPasswordPlaceholder: 'পুনরায় একই পাসওয়ার্ড দিন',
    loginSubmitBtn: 'লগইন করুন',
    registerSubmitBtn: 'নতুন অ্যাকাউন্ট খুলুন',
    processing: 'প্রক্রিয়াকরণ হচ্ছে...',
    passwordMismatch: 'উভয় পাসওয়ার্ড হুবহু একই হতে হবে।',
    passwordTooShort: 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে।',
    fullNameRequired: 'আপনার পূর্ণ নাম প্রদান করুন।',
    emailInvalid: 'সঠিক ইমেইল অ্যাড্রেস প্রদান করুন।',
    welcomeBack: 'স্বাগতম, আপনার অ্যাকাউন্টে সফলভাবে প্রবেশ করেছেন।',
    registrationSuccess: 'আপনার ব্যবসা অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।',
    loggedOut: 'সফলভাবে লগআউট সম্পন্ন হয়েছে।',
    authNotice: 'ফেজ ০৩: সেশন ও ইউজার অথেনটিকেশন সক্রিয়।'
  },

  products: {
    title: 'পণ্য ও স্টক খতিয়ান',
    subtitle: 'দোকানের সকল পণ্য তালিকা, বিক্রয়মূল্য ও বর্তমান ইনভেন্টরি স্টক',
    addProductBtn: 'নতুন পণ্য যোগ',
    editProductBtn: 'পণ্য সম্পাদনা',
    searchPlaceholder: 'পণ্যের নাম বা কোড দিয়ে খুঁজুন...',
    allCategories: 'সকল ক্যাটাগরি',
    filterActive: 'চলতি পণ্য',
    filterArchived: 'আর্কাইভকৃত',
    filterAll: 'সকল পণ্য',
    
    // Stats
    totalProducts: 'মোট পণ্য সংখ্যা',
    lowStockAlerts: 'স্বল্প স্টক সতর্কতা',
    totalInventoryValue: 'মোট মজুদ মূল্য (ক্রয়মূল্য)',
    
    // Table Headers
    colProduct: 'পণ্য ও কোড',
    colCategory: 'ক্যাটাগরি',
    colUnit: 'একক',
    colPurchasePrice: 'ক্রয়মূল্য',
    colSellingPrice: 'বিক্রয়মূল্য',
    colStock: 'বর্তমান স্টক',
    colStatus: 'অবস্থা',
    colActions: 'অ্যাকশন',
    
    // Status
    statusInStock: 'মজুদ আছে',
    statusLowStock: 'স্বল্প স্টক',
    statusOutOfStock: 'স্টক শেষ',
    statusArchived: 'আর্কাইভকৃত',
    
    // Actions
    edit: 'সম্পাদনা',
    archive: 'আর্কাইভ',
    restore: 'পুনরুদ্ধার',
    confirmArchive: 'আপনি কি এই পণ্যটি আর্কাইভ করতে চান?',
    confirmRestore: 'আপনি কি এই পণ্যটি পুনরায় সক্রিয় করতে চান?',
    
    // Modal Form
    modalAddTitle: 'নতুন পণ্য অন্তর্ভুক্ত করুন',
    modalEditTitle: 'পণ্য তথ্য হালনাগাদ করুন',
    nameLabel: 'পণ্যের নাম *',
    namePlaceholder: 'উদা: মিনিকেট চাল (৫০ কেজি বস্তা)',
    codeLabel: 'পণ্য কোড / SKU',
    codePlaceholder: 'উদা: RICE-01',
    categoryLabel: 'ক্যাটাগরি',
    categoryPlaceholder: 'উদা: মুদি ও খাদ্যদ্রব্য',
    unitLabel: 'পরিমাপের একক',
    purchasePriceLabel: 'ক্রয়মূল্য (৳)',
    sellingPriceLabel: 'বিক্রয়মূল্য (৳)',
    stockQuantityLabel: 'বর্তমান প্রারম্ভিক স্টক',
    lowStockThresholdLabel: 'স্বল্প স্টক সতর্কতার সীমা',
    saveBtn: 'সংরক্ষণ করুন',
    savingBtn: 'সংরক্ষণ হচ্ছে...',
    cancelBtn: 'বাতিল',
    
    // Units
    unit_piece: 'পিস (Piece)',
    unit_kg: 'কেজি (Kg)',
    unit_gram: 'গ্রাম (Gram)',
    unit_litre: 'লিটার (Litre)',
    unit_ml: 'মিলি (ml)',
    unit_box: 'কার্টন/বক্স (Box)',
    unit_packet: 'প্যাকেট (Packet)',
    unit_dozen: 'ডজন (Dozen)',
    unit_meter: 'মিটার (Meter)',
    unit_other: 'অন্যান্য (Other)',
    
    // Empty & Auth
    emptyState: 'কোনো পণ্য পাওয়া যায়নি',
    emptyStateSub: 'আপনার দোকানে নতুন পণ্য যোগ করতে উপরের "নতুন পণ্য যোগ" বাটনে চাপুন।',
    authRequiredTitle: 'পণ্য তালিকা দেখতে লগইন করুন',
    authRequiredText: 'ব্যক্তিগত পণ্যের হিসাব ও মজুদ দেখতে অনুগ্রহ করে আপনার অ্যাকাউন্টে লগইন করুন।'
  },

  customers: {
    title: 'ক্রেতা খাতা ও গ্রাহক তালিকা',
    subtitle: 'দোকানের নিবন্ধিত সকল গ্রাহক, মোবাইল নম্বর এবং ঠিকানা তালিকা',
    addCustomerBtn: 'নতুন ক্রেতা যোগ করুন',
    editCustomerBtn: 'তথ্য পরিবর্তন',
    viewDetailsBtn: 'বিস্তারিত প্রোফাইল',
    searchPlaceholder: 'ক্রেতার নাম, মোবাইল বা ঠিকানা দিয়ে খুঁজুন...',
    filterActive: 'নিয়মিত ক্রেতা',
    filterArchived: 'আর্কাইভকৃত',
    filterAll: 'সকল ক্রেতা',
    
    // Stats
    totalCustomers: 'মোট নিবন্ধিত ক্রেতা',
    activeCustomers: 'সক্রিয় গ্রাহক',
    archivedCustomers: 'আর্কাইভকৃত প্রোফাইল',
    
    // Table Headers
    colCustomer: 'ক্রেতার নাম',
    colPhone: 'মোবাইল নম্বর',
    colAddress: 'দোকান / ঠিকানা',
    colStatus: 'অবস্থা',
    colActions: 'অ্যাকশন',
    
    // Status
    statusActive: 'চলতি',
    statusArchived: 'আর্কাইভ',
    
    // Actions
    edit: 'সম্পাদনা',
    archive: 'আর্কাইভ',
    restore: 'পুনরুদ্ধার',
    confirmArchive: 'আপনি কি নিশ্চিতভাবে এই ক্রেতার প্রোফাইল আর্কাইভ করতে চান?',
    confirmRestore: 'আপনি কি এই ক্রেতার প্রোফাইল পুনরায় সক্রিয় করতে চান?',
    
    // Modal Form
    modalAddTitle: 'নতুন ক্রেতা নিবন্ধন ফর্ম',
    modalEditTitle: 'ক্রেতার তথ্য সংশোধন',
    nameLabel: 'ক্রেতার পূর্ণ নাম *',
    namePlaceholder: 'যেমন: হাজী মোহাম্মদ আলী',
    phoneLabel: 'মোবাইল নম্বর *',
    phonePlaceholder: 'যেমন: ০১৭১২-৩৪৫৬৭৮',
    phoneHint: '১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর বা আন্তর্জাতিক ফরম্যাট (+৮৮০...) লিখুন',
    addressLabel: 'দোকান বা বাসার ঠিকানা',
    addressPlaceholder: 'যেমন: ১৪ চক সার্কুলার রোড, ঢাকা',
    nidLabel: 'জাতীয় পরিচয়পত্র (NID) (ঐচ্ছিক)',
    nidPlaceholder: 'যেমন: ১৯৮৫২৬৯১২৩৪৫৬৭৮৯০',
    nidSecurityNotice: 'এনআইডি সংবেদনশীল ব্যক্তিগত তথ্য। এটি সুরক্ষিত ও গোপন থাকে এবং সাধারণ পাবলিক তালিকায় দেখানো হয় না।',
    notesLabel: 'দোকানের অভ্যন্তরীণ নোট বা রেফারেন্স (ঐচ্ছিক)',
    notesPlaceholder: 'যেমন: নিউ মার্কেট ব্যবসায়ী সমিতি, অমুকের রেফারেন্স...',
    saveBtn: 'ক্রেতা সংরক্ষণ করুন',
    savingBtn: 'সংরক্ষণ হচ্ছে...',
    cancelBtn: 'বাতিল',
    
    // Detail Modal
    detailTitle: 'ক্রেতার বিস্তারিত প্রোফাইল',
    personalInfo: 'যোগাযোগের তথ্য',
    nidField: 'জাতীয় পরিচয়পত্র (এনআইডি)',
    nidNotProvided: 'যুক্ত করা হয়নি',
    notesField: 'অভ্যন্তরীণ নোট',
    noNotes: 'এই ক্রেতার জন্য কোনো অতিরিক্ত নোট নেই।',
    registeredOn: 'নিবন্ধনের তারিখ',
    lastUpdated: 'সর্বশেষ পরিবর্তন',
    
    // Empty & Auth
    emptyState: 'কোনো ক্রেতা পাওয়া যায়নি',
    emptyStateSub: 'আপনার দোকানে নতুন গ্রাহক যোগ করতে উপরের "নতুন ক্রেতা যোগ করুন" বাটনে চাপ দিন।',
    authRequiredTitle: 'ক্রেতা তালিকা দেখতে লগইন করুন',
    authRequiredText: 'ক্রেতাদের তথ্য সুরক্ষিত ও আলাদা খতিয়ানে রাখা হয়। খাতা দেখতে অনুগ্রহ করে আপনার অ্যাকাউন্টে লগইন করুন।'
  },

  sales: {
    title: 'বিক্রয় ও লেনদেন খাতা',
    subtitle: 'নগদ বিক্রয় রেকর্ড, রসিদ ট্র্যাকিং এবং মজুদ সমন্বয় সহ বিক্রির ইতিহাস',
    newSaleBtn: 'নতুন বিক্রয় ভাউচার',
    viewDetailsBtn: 'ভাউচার দেখুন',
    searchPlaceholder: 'ভাউচার নম্বর, ক্রেতার নাম, ফোন বা পণ্য দিয়ে খুঁজুন...',
    allDates: 'সকল তারিখ',
    today: 'আজ',
    thisWeek: 'এই সপ্তাহ',
    thisMonth: 'এই মাস',
    
    // Stats
    totalSales: 'মোট বিক্রয় ভাউচার',
    totalRevenue: 'সর্বমোট বিক্রয়',
    cashReceived: 'নগদ গ্রহণ',
    
    // Table Headers
    colInvoice: 'ভাউচার #',
    colDate: 'তারিখ ও সময়',
    colCustomer: 'ক্রেতা',
    colItems: 'পণ্য সংখ্যা',
    colTotal: 'মোট মূল্য (৳)',
    colPayment: 'পরিশোধ',
    colActions: 'অ্যাকশন',
    
    // Payment badge & types
    paymentCash: 'নগদ',
    paymentTypeLabel: 'পরিশোধের ধরন',
    paymentTypeCash: 'সম্পূর্ণ নগদ পরিশোধ (তাত্ক্ষণিক)',
    paymentTypeCredit: 'বাকিতে বিক্রয় (সম্পূর্ণ বাকি)',
    paymentTypePartial: 'আংশিক পরিশোধ (জমা ও বাকি)',
    initialPaymentLabel: 'এখন জমা (৳)',
    remainingDueLabel: 'অবশিষ্ট বাকি (৳)',
    customerRequiredForCredit: 'বাকি বা আংশিক পরিশোধে বিক্রয় করতে নিবন্ধিত নিয়মিত ক্রেতা নির্বাচন আবশ্যক।',
    statusPaid: 'পরিশোধিত',
    statusPartial: 'আংশিক বাকি',
    statusDue: 'সম্পূর্ণ বাকি',
    filterAllPayments: 'সকল বিক্রয়',
    filterPaid: 'পরিশোধিত',
    filterPartial: 'আংশিক বাকি',
    filterDue: 'বকেয়া বাকি',
    colPaid: 'পরিশোধ (৳)',
    colDue: 'বাকি (৳)',
    collectDueBtn: 'বাকি আদায়',
    paymentHistory: 'পরিশোধের ইতিহাস',
    noPaymentsRecorded: 'এই বিক্রয়ের জন্য কোনো আলাদা জমা রেকর্ড নেই।',
    method_cash: 'নগদ (Cash)',
    method_bkash: 'বিকাশ (bKash)',
    method_nagad: 'নগদ (Nagad)',
    method_rocket: 'রকেট (Rocket)',
    method_bank_transfer: 'ব্যাংক স্থানান্তর',
    
    // Form Modal
    modalTitle: 'নতুন বিক্রয় ভাউচার তৈরি',
    selectCustomer: 'ক্রেতা নির্বাচন করুন (নগদে ঐচ্ছিক, বাকিতে আবশ্যক)',
    walkInCustomer: 'সাধারণ / খুচরা নগদ ক্রেতা',
    addItemBtn: 'পণ্য যোগ করুন',
    selectProductPlaceholder: 'পণ্য বাছাই করুন...',
    availableStock: 'মজুদ:',
    qtyLabel: 'পরিমাণ',
    priceLabel: 'দর (৳)',
    totalLabel: 'মোট (৳)',
    grandTotal: 'সর্বমোট মূল্য',
    paymentMethodNotice: 'ক্রেতার বাকি ও আংশিক জমার হিসাব স্বয়ংক্রিয়ভাবে খতিয়ানে সংরক্ষণ করা হবে।',
    notesLabel: 'ভাউচার নোট বা রেফারেন্স (ঐচ্ছিক)',
    notesPlaceholder: 'যেমন: কাউন্টার বিক্রয়, স্পেশাল প্যাকেজিং...',
    submitSaleBtn: 'বিক্রয় নিশ্চিত ও সম্পন্ন করুন',
    submittingSale: 'বিক্রয় ও স্টক হালনাগাদ হচ্ছে...',
    cancelBtn: 'বাতিল',
    outOfStockNotice: 'মজুদ পর্যাপ্ত নয়',
    noItemsAlert: 'অনুগ্রহ করে অন্তত একটি পণ্য এবং সঠিক পরিমাণ নির্বাচন করুন।',
    
    // Detail Modal
    detailTitle: 'বিক্রয় ভাউচারের বিস্তারিত',
    voucherSummary: 'ভাউচার সারসংক্ষেপ',
    customerInfo: 'ক্রেতার বিবরণ',
    itemBreakdown: 'পণ্যভিত্তিক বিবরণ',
    colProduct: 'পণ্যের নাম',
    colCode: 'কোড',
    colUnitPrice: 'একক দর (৳)',
    colQty: 'পরিমাণ',
    colLineTotal: 'মোট (৳)',
    subtotalLabel: 'উপমোট',
    discountLabel: 'ছাড়',
    grandTotalLabel: 'সর্বমোট',
    paidAmountLabel: 'পরিশোধিত পরিমাণ',
    dueAmountLabel: 'বকেয়া বাকি',
    paymentStatusLabel: 'পরিশোধের অবস্থা',
    paymentMethodLabel: 'পরিশোধের মাধ্যম',
    notesLabelDetail: 'মন্তব্য / নোট',
    noNotes: 'এই বিক্রয়ের জন্য কোনো মন্তব্য নেই।',
    
    // Empty & Auth
    emptyState: 'এখনো কোনো বিক্রয় রেকর্ড করা হয়নি',
    emptyStateSub: 'দোকানের প্রথম বিক্রয় এন্ট্রি করতে উপরের "নতুন বিক্রয় ভাউচার" বাটনে চাপ দিন।',
    authRequiredTitle: 'বিক্রয় ইতিহাস দেখতে লগইন করুন',
    authRequiredText: 'বিক্রয় তথ্য ও মজুদ সমন্বয় সুরক্ষিত। বিক্রয় খাতা দেখতে অনুগ্রহ করে লগইন করুন।'
  },

  dues: {
    title: 'বাকি খাতা ও দেনা-পাওনা খতিয়ান',
    subtitle: 'গ্রাহকদের মোট বাকি পর্যবেক্ষণ, ভাউচারের বাকি আদায় এবং আদায়ের লেজার খতিয়ান',
    totalDue: 'সর্বমোট বকেয়া পাওনা',
    customersWithDue: 'বাকিদার গ্রাহক সংখ্যা',
    unpaidVouchers: 'অপরিশোধিত ভাউচার সংখ্যা',
    searchPlaceholder: 'ক্রেতার নাম, মোবাইল বা ঠিকানা দিয়ে খুঁজুন...',
    filterAll: 'সকল বাকিদার ক্রেতা',
    
    // Table Headers
    colCustomer: 'ক্রেতার নাম',
    colPhone: 'মোবাইল',
    colUnpaidCount: 'বাকি ভাউচার',
    colTotalPurchases: 'মোট ক্রয় (৳)',
    colTotalPaid: 'মোট পরিশোধ (৳)',
    colTotalDue: 'বকেয়া বাকি (৳)',
    colActions: 'অ্যাকশন',
    
    // Actions
    collectDueBtn: 'বাকি আদায়',
    viewStatementBtn: 'খতিয়ান দেখুন',
    
    // Collect Due Modal
    modalCollectTitle: 'বাকি টাকা জমা গ্রহণ',
    voucherInfo: 'ভাউচার তথ্য',
    voucherNumber: 'ভাউচার #',
    customerName: 'ক্রেতা',
    saleGrandTotal: 'ভাউচারের মোট মূল্য',
    salePaidAmount: 'পূর্বের পরিশোধ',
    currentDue: 'বর্তমান বকেয়া বাকি',
    collectAmountLabel: 'আদায়ের পরিমাণ (৳) *',
    collectAmountPlaceholder: 'টাকার পরিমাণ লিখুন',
    paymentMethodLabel: 'আদায়ের মাধ্যম',
    paymentNotesLabel: 'রসিদ বা রেফারেন্স নোট (ঐচ্ছিক)',
    paymentNotesPlaceholder: 'যেমন: ক্যাশ কাউন্টারে জমা, ট্রানজেকশন আইডি...',
    submitPaymentBtn: 'জমা নিশ্চিত করুন ও খতিয়ানে সংরক্ষণ করুন',
    processingPayment: 'খতিয়ানে জমা রেকর্ড হচ্ছে...',
    cancelBtn: 'বাতিল',
    
    // Statement Modal
    statementTitle: 'ক্রেতার ব্যক্তিগত খতিয়ান ও হিসাব বিবরনী',
    summaryTab: 'সারসংক্ষেপ',
    unpaidInvoicesTab: 'বকেয়া ভাউচারসমূহ',
    paymentLedgerTab: 'জমার রসিদ লেজার',
    allInvoicesTab: 'সকল ক্রয় ইতিহাস',
    noUnpaidInvoices: 'এই ক্রেতার কোনো বকেয়া বাকি নেই। সকল ভাউচার পরিশোধিত।',
    noPayments: 'এখনো কোনো জমার রসিদ রেকর্ড করা হয়নি।',
    colReceiptNo: 'রসিদ #',
    colPaidAt: 'তারিখ ও সময়',
    colMethod: 'মাধ্যম',
    colAmount: 'টাকা (৳)',
    colVoucherRef: 'সংশ্লিষ্ট ভাউচার',
    
    // Empty & Auth
    emptyState: 'কোনো বকেয়া বাকি নেই',
    emptyStateSub: 'মাশাআল্লাহ! আপনার দোকানের সকল গ্রাহকের হিসাব সম্পূর্ণ পরিশোধিত।',
    authRequiredTitle: 'বাকি খাতা দেখতে লগইন করুন',
    authRequiredText: 'গ্রাহকের দেনা-পাওনার হিসাব সুরক্ষিত ও গোপনীয়। অনুগ্রহ করে লগইন করুন।'
  },

  dashboard: {
    title: 'ড্যাশবোর্ড ওভারভিউ',
    subtitle: 'আজকের ব্যবসার সার্বিক আর্থিক চিত্র ও খতিয়ান',
    demoDataNotice: 'নমুনা তথ্য — এটি ফেজ ০১ ডিজাইন সিস্টেমের জন্য প্রদর্শিত প্রিভিউ।',
    demoDataBadge: 'ডেমো ডেটা',
    lastUpdated: 'সর্বশেষ আপডেট: আজ দুপুর ১২:৪৫',
    
    // KPI Cards
    todaySales: 'আজকের মোট বিক্রয়',
    todaySalesSub: 'গতকালের চেয়ে +১৫.২% বেশি',
    cashCollected: 'আজকের নগদ জমা',
    cashCollectedSub: 'ক্যাশ ড্রয়ার ও সরাসরি প্রাপ্তি',
    newCredit: 'আজকের বাকি বিক্রয়',
    newCreditSub: '৪ জন নিয়মিত ক্রেতার হিসাবে যোগ',
    totalOutstanding: 'সর্বমোট বকেয়া পাওনা',
    totalOutstandingSub: '১৮ জন গ্রাহকের নিকট বকেয়া বাকি',

    // Quick Actions
    quickActions: 'জরুরি অপশন',
    newSaleBtn: 'নতুন বিক্রয় এন্ট্রি',
    newSaleDesc: 'নগদ বা বাকিতে পণ্য বিক্রয় রেকর্ড করুন',
    collectDueBtn: 'বাকি আদায় করুন',
    collectDueDesc: 'গ্রাহকের পূর্বের বকেয়া খতিয়ানে জমা নিন',
    addCustomerBtn: 'নতুন ক্রেতা খাতা',
    addCustomerDesc: 'নতুন গ্রাহকের নাম ও ঠিকানা সংরক্ষণ',
    addProductBtn: 'পণ্য তালিকাভুক্ত করুন',
    addProductDesc: 'মূল্য ও স্টক পরিমাণ হালনাগাদ',

    // Recent Transactions
    recentActivityTitle: 'আজকের সাম্প্রতিক লেনদেন',
    recentActivitySub: 'বিক্রয়, বাকি এবং কিস্তি আদায়ের রিয়েল-টাইম খতিয়ান',
    filterAll: 'সকল লেনদেন',
    filterCashSale: 'নগদ বিক্রয়',
    filterCreditSale: 'বাকি বিক্রয়',
    filterDueCollection: 'বাকি আদায়',
    searchTable: 'ক্রেতার নাম বা মোবাইল দিয়ে খুঁজুন...',
    
    // Table Headers
    colTime: 'সময় ও রসিদ',
    colCustomer: 'ক্রেতার নাম ও মোবাইল',
    colItems: 'পণ্যের বিবরণ / নোট',
    colType: 'লেনদেনের ধরন',
    colAmount: 'টাকার পরিমাণ',
    colStatus: 'অবস্থা',

    // Statuses
    typeCashSale: 'নগদ বিক্রয়',
    typeCreditSale: 'বাকি বিক্রয়',
    typeDueCollection: 'বাকি আদায়',
    statusPaid: 'নগদ পরিশোধ',
    statusDue: 'বকেয়া হিসাব',
    statusCollected: 'আদায় সম্পন্ন',
    emptyTable: 'কোনো লেনদেনের তথ্য পাওয়া যায়নি',
    totalCount: 'মোট লেনদেন সংখ্যা:',

    // High Dues Widget
    highDueTitle: 'জরুরি বকেয়া তাগাদা তালিকা',
    highDueSub: '১৫ দিনের বেশি সময় ধরে অপরিশোধিত বাকি',
    sendReminder: 'তাগাদা এসএমএস',
    viewAllDue: 'সম্পূর্ণ বাকি খাতা দেখুন'
  },

  modal: {
    noticeTitle: 'ফেজ ০১ ইন্টারফেস প্রিভিউ',
    noticeText: 'আপনি হিসাবখাতা অ্যাপ্লিকেশনের ফেজ ০১ ফ্রন্টএন্ড ডিজাইন সিস্টেম ব্যবহার করছেন। ডাটাবেজ সংরক্ষণ, পণ্য যোগ এবং বিক্রয় প্রক্রিয়াকরণ পরবর্তী ফেজে (Phase 02) বাস্তবায়ন করা হবে।',
    actionNotice: 'এই অ্যাকশনটি পরবর্তী ধাপে সক্রিয় করা হবে।',
    closeBtn: 'ঠিক আছে, বুঝতে পেরেছি'
  },

  footer: {
    rights: 'হিসাবখাতা — ক্ষুদ্র ও মাঝারি ব্যবসার বিশ্বস্ত বুককিপিং সমাধান',
    phase: 'ফেজ ০১: ফ্রন্টএন্ড ফাউন্ডেশন ও ডিজাইন সিস্টেম'
  }
};
