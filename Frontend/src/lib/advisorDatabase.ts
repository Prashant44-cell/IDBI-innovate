// Offline Advisor Database & Intent Matcher
// Built to support offline banking/wealth advisory queries with reasoning and multilingual outputs.

export interface ReasoningStep {
  title: string;
  detail: string;
}

export interface AdvisorResponse {
  answer: string;
  reasoning: ReasoningStep[];
  addons?: {
    type: "asset" | "budget" | "wealth" | "emi" | "tax";
    data: any;
  };
}

export interface IntentConfig {
  id: string;
  keywords: string[]; // Keywords to trigger this intent
  subCategory: string;
  responses: {
    [langCode: string]: {
      answer: string;
      reasoning: { title: string; detail: string }[];
    };
  };
  addons?: (query: string) => any;
}

// Subcategory definitions covering ~500 daily financial queries/variations grouped by intent
export const advisorIntents: IntentConfig[] = [
  {
    id: "sip_investment",
    keywords: ["sip", "mutual fund", "invest", "investment", "grow money", "grow wealth", "where to invest", "निवेश", "म्युचुअल फंड", "गुंतवणूक", "बचत"],
    subCategory: "Mutual Funds & SIPs",
    responses: {
      "en-IN": {
        answer: "Starting a Systematic Investment Plan (SIP) in diversified equity index funds is highly recommended. It enforces disciplined savings and leverages rupee-cost averaging to beat inflation over the long term.",
        reasoning: [
          { title: "Power of Compounding", detail: "Investing monthly allows interest to accumulate on interest, generating exponential growth over 5-10 years." },
          { title: "Rupee-Cost Averaging", detail: "You automatically buy more mutual fund units when markets are down and fewer units when markets are up." },
          { title: "Suggested Allocation", detail: "70% Large/Mid-Cap Index Funds, 20% Debt Funds for stability, 10% Gold/Alternatives." }
        ]
      },
      "hi-IN": {
        answer: "विविध इक्विटी इंडेक्स फंड में सिस्टेमैटिक इन्वेस्टमेंट प्लान (SIP) शुरू करने की सलाह दी जाती है। यह अनुशासित बचत को बढ़ावा देता है और दीर्घकालिक निवेश से बेहतर रिटर्न प्रदान करता है।",
        reasoning: [
          { title: "चक्रवृद्धि की शक्ति", detail: "हर महीने निवेश करने से ब्याज पर ब्याज मिलता है, जिससे 5-10 वर्षों में शानदार बढ़त होती है।" },
          { title: "लागत का औसत (Averaging)", detail: "बाजार गिरावट में अधिक यूनिट और बाजार उछाल में कम यूनिट्स स्वचालित रूप से खरीदी जाती हैं।" },
          { title: "सुझाया गया आवंटन", detail: "70% इक्विटी इंडेक्स फंड, 20% सुरक्षित डेट फंड, और 10% गोल्ड।" }
        ]
      },
      "mr-IN": {
        answer: "इक्विटी इंडेक्स फंडांमध्ये सिस्टिमॅटिक इन्व्हेस्टमेंट प्लॅन (SIP) सुरू करण्याची शिफारस केली जाते. हे शिस्तबद्ध बचत वाढवते आणि महागाईवर मात करते.",
        reasoning: [
          { title: "चक्रवाढ व्याजाची ताकद", detail: "दरमहा गुंतवणूक केल्याने व्याजावर व्याज जमा होते आणि ५-१० वर्षांत मोठी संपत्ती तयार होते." },
          { title: "रुपी-कॉस्ट एव्हरेजींग", detail: "मार्केट खाली असताना जास्त युनिट्स आणि वर असताना कमी युनिट्स आपोआप खरेदी होतात." }
        ]
      }
    },
    addons: () => ({
      type: "asset",
      data: { equity: 70, debt: 20, alt: 10 }
    })
  },
  {
    id: "emergency_fund",
    keywords: ["emergency", "emergency fund", "emergency savings", "crisis money", "liquid fund", "आपातकालीन", "इमरजेंसी", "संकट समय", "तातडीचा निधी"],
    subCategory: "Emergency Funds",
    responses: {
      "en-IN": {
        answer: "An emergency fund is your financial safety net. You should keep at least 6 months of your monthly expenses in a highly liquid savings account or liquid mutual fund.",
        reasoning: [
          { title: "6-Month Rule", detail: "If your monthly expenses are ₹32,400, your target emergency fund should be around ₹2,00,000." },
          { title: "Capital Protection", detail: "Prioritize low-risk instruments over high-return equity for this specific fund." },
          { title: "Instant Liquidity", detail: "Keep 30% in cash/savings account, and 70% in high-yield sweeping FDs or liquid funds." }
        ]
      },
      "hi-IN": {
        answer: "एक आपातकालीन कोष (Emergency Fund) आपका वित्तीय सुरक्षा कवच है। आपको अपने कम से कम 6 महीने के मासिक खर्च के बराबर राशि पूरी तरह सुरक्षित और लिक्विड फंड्स में रखनी चाहिए।",
        reasoning: [
          { title: "6 महीने का नियम", detail: "यदि आपका मासिक खर्च ₹32,400 है, तो आपातकालीन फंड का लक्ष्य ₹2,00,000 होना चाहिए।" },
          { title: "सुरक्षा प्राथमिकता", detail: "इस कोष के लिए शेयर बाजार के बजाय फिक्स्ड डिपॉजिट या लिक्विड फंड्स को चुनें।" }
        ]
      },
      "mr-IN": {
        answer: "आणीबाणीचा निधी (Emergency Fund) हा तुमच्या आर्थिक सुरक्षेचा कणा आहे. तुमच्या मासिक खर्चाच्या किमान ६ पट रक्कम लिक्विड स्वरूपात ठेवली पाहिजे.",
        reasoning: [
          { title: "६ महिन्यांचा नियम", detail: "खर्च ३२,४०० रुपये असल्यास कमीत कमी २ लाख रुपये सुरक्षित ठेवावेत." }
        ]
      }
    },
    addons: () => ({
      type: "budget",
      data: { spent: 32400, limit: 40000 }
    })
  },
  {
    id: "loan_affordability",
    keywords: ["loan", "emi", "afford", "borrow", "home loan", "car loan", "personal loan", "लोन", "कर्ज", "ईएमआई", "हप्ता"],
    subCategory: "Debt & EMIs",
    responses: {
      "en-IN": {
        answer: "When taking a loan, ensure your total monthly EMIs do not exceed 35% to 40% of your net monthly take-home income. Keeping this ratio safe protects your cash flows.",
        reasoning: [
          { title: "FOIR Check", detail: "Fixed Obligation to Income Ratio should be under 40% (₹34,000 max EMI limit for an ₹85,000 monthly income)." },
          { title: "Credit Score Impact", detail: "Paying EMIs on time maintains a credit score above 750, securing lower interest rates in the future." },
          { title: "Home Loan Strategy", detail: "Always opt for floating interest rates for long-term home loans to benefit from rate cuts." }
        ]
      },
      "hi-IN": {
        answer: "लोन लेते समय यह सुनिश्चित करें कि आपकी कुल मासिक ईएमआई (EMI) आपकी कुल मासिक शुद्ध आय के 35% से 40% से अधिक न हो। इस सीमा में रहने से आपका बजट संतुलित रहेगा।",
        reasoning: [
          { title: "FOIR जांच", detail: "₹85,000 मासिक आय पर अधिकतम EMI ₹34,000 से कम होनी चाहिए (सुरक्षित सीमा ₹25,000 है)।" },
          { title: "ब्याज दर प्रभाव", detail: "भविष्य में कम ब्याज दरों का लाभ उठाने के लिए हमेशा अपना क्रेडिट स्कोर 750+ बनाए रखें।" }
        ]
      },
      "mr-IN": {
        answer: "कर्ज घेताना तुमचे एकूण मासिक हप्ते (EMI) तुमच्या उत्पन्नाच्या ३५% ते ४०% पेक्षा जास्त नसावेत. जेणेकरून तुमचे बजेट सुरक्षित राहील.",
        reasoning: [
          { title: "FOIR मर्यादा", detail: "८५,००० रुपयांच्या उत्पन्नावर जास्तीत जास्त ३४,००० रुपयांपर्यंत हप्ता सुरक्षित मानला जातो." }
        ]
      }
    },
    addons: () => ({
      type: "emi",
      data: { limit: 25000, income: 85000 }
    })
  },
  {
    id: "budget_optimization",
    keywords: ["save", "saving", "budget", "spend", "expense", "cut spend", "swiggy", "netflix", "zomato", "बचत", "खर्च", "बजेट", "पैसे वाचवा"],
    subCategory: "Budgeting & Saving",
    responses: {
      "en-IN": {
        answer: "We recommend practicing the 50-30-20 budget framework: 50% for Needs (rent, utilities), 30% for Wants (dining out, entertainment), and 20% for Savings and Investments.",
        reasoning: [
          { title: "Automating Savings", detail: "Set auto-debit for investments on your salary credit day before you start spending." },
          { title: "Lifestyle Inflation", detail: "Keep discretionary expenses (like food deliveries, Netflix, streaming) locked below 15% of your income." },
          { title: "Your Progress", detail: "Currently, you save around ₹52,600 monthly, which is an excellent 61.8% saving rate!" }
        ]
      },
      "hi-IN": {
        answer: "हम 50-30-20 बजट नियम की सलाह देते हैं: 50% अनिवार्य जरूरतों (किराया, बिल) के लिए, 30% इच्छाओं (मनोरंजन, बाहर खाना) के लिए, और 20% निवेश/बचत के लिए।",
        reasoning: [
          { title: "बचत का स्वचालन (Automation)", detail: "वेतन आते ही निवेश राशि का ऑटो-डेबिट सेट करें, खर्च के बाद बची राशि से निवेश न करें।" },
          { title: "आपकी वर्तमान स्थिति", detail: "आप हर महीने ₹52,600 बचा रहे हैं, जो आपकी आय का 61.8% है — यह बेहतरीन प्रदर्शन है।" }
        ]
      },
      "mr-IN": {
        answer: "आम्ही ५०-३०-२० बजेट नियमाचा सल्ला देतो: ५०% गरजांसाठी, ३०% इच्छांसाठी आणि २०% बचतीसाठी.",
        reasoning: [
          { title: "बचत स्वयंचलित करा", detail: "पगार जमा होताच पहिली रक्कम गुंतवणुकीकडे वळवा." }
        ]
      }
    },
    addons: () => ({
      type: "wealth",
      data: { balance: 428500, score: 85 }
    })
  },
  {
    id: "tax_planning",
    keywords: ["tax", "income tax", "80c", "deduction", "elss", "regime", "new tax", "old tax", "टैक्स", "आयकर", "कर बचत", "कर"],
    subCategory: "Taxation & Planning",
    responses: {
      "en-IN": {
        answer: "To optimize taxes in India, evaluate New vs Old Regimes. Under the Old Regime, maximize Section 80C deductions up to ₹1.5 Lakhs through ELSS Mutual Funds, PPF, or NPS.",
        reasoning: [
          { title: "ELSS Mutual Funds", detail: "Tax-saving mutual funds offer the shortest lock-in (3 years) and high potential equity returns." },
          { title: "National Pension Scheme", detail: "Get an additional ₹50,000 deduction under Section 80CCD(1B) specifically for retirement." },
          { title: "New Tax Regime Advantage", detail: "The New Regime offers lower tax rates with standard deduction of ₹75,000 without requiring 80C declarations." }
        ]
      },
      "hi-IN": {
        answer: "टैक्स बचत के लिए नई और पुरानी कर व्यवस्था का मूल्यांकन करें। पुरानी व्यवस्था के तहत, ELSS, PPF या NPS के माध्यम से धारा 80C के तहत ₹1.5 लाख तक की छूट का लाभ उठाएं।",
        reasoning: [
          { title: "ELSS म्युचुअल फंड", detail: "यह केवल 3 साल के सबसे कम लॉक-इन पीरियड और शानदार इक्विटी रिटर्न के साथ टैक्स बचाता है।" },
          { title: "नेशनल पेंशन स्कीम (NPS)", detail: "रिटायरमेंट के लिए धारा 80CCD(1B) के तहत ₹50,000 की अतिरिक्त छूट प्राप्त करें।" }
        ]
      },
      "mr-IN": {
        answer: "कर बचतीसाठी योग्य नियोजन आवश्यक आहे. जुन्या कर रचनेत कलम 80C अंतर्गत दीड लाख रुपयांपर्यंत वजावट मिळू शकते.",
        reasoning: [
          { title: "ELSS फंड", detail: "फक्त ३ वर्षांचा लॉक-इन कालावधी असलेला उत्तम कर बचत पर्याय." }
        ]
      }
    },
    addons: () => ({
      type: "tax",
      data: { standardDeduction: 75000, rebateLimit: 700000 }
    })
  },
  {
    id: "gold_investment",
    keywords: ["gold", "digital gold", "sovereign gold", "sgb", "gold etf", "सोना", "गोल्ड", "डिजिटल गोल्ड", "सुवर्ण कर्ज", "सोने"],
    subCategory: "Gold & Safe Havens",
    responses: {
      "en-IN": {
        answer: "Gold acts as a safe haven and hedge against inflation. Keeping 5% to 10% of your portfolio in Sovereign Gold Bonds (SGBs) or Gold Mutual Funds/ETFs is ideal.",
        reasoning: [
          { title: "Sovereign Gold Bonds", detail: "Issued by RBI, SGBs offer a 2.5% annual interest payout and are tax-free on redemption if held till maturity." },
          { title: "Digital Gold & ETFs", detail: "Offer immediate liquidity and allow buying gold in low denominations (starting from ₹100) safely." },
          { title: "Portfolio Hedge", detail: "During equity market corrections or global uncertainties, gold prices generally rise, balancing your risk." }
        ]
      },
      "hi-IN": {
        answer: "सोना एक सुरक्षित निवेश है जो मुद्रास्फीति (Inflation) से सुरक्षा प्रदान करता है। अपने कुल पोर्टफोलियो का 5% से 10% हिस्सा सॉवरेन गोल्ड बॉन्ड (SGB) या डिजिटल गोल्ड में रखना चाहिए।",
        reasoning: [
          { title: "सॉवरेन गोल्ड बॉन्ड (SGB)", detail: "RBI द्वारा जारी, यह हर साल 2.5% अतिरिक्त ब्याज देता है और परिपक्वता पर टैक्स-फ्री होता है।" },
          { title: "पोर्टफोलियो का संतुलन", detail: "शेयर बाजार में गिरावट के दौरान सोने के दाम बढ़ने से आपके निवेश में स्थिरता आती है।" }
        ]
      },
      "mr-IN": {
        answer: "महागाई विरोधातील संरक्षणासाठी पोर्टफोलिओमध्ये ५% ते १०% सोने (Sovereign Gold Bonds किंवा Gold ETFs) ठेवणे उत्तम मानले जाते.",
        reasoning: [
          { title: "SGB पर्याय", detail: "वार्षिक २.५% व्याज देणारा आणि मॅच्युरिटीवर करमुक्त असणारा सरकारी पर्याय." }
        ]
      }
    }
  },
  {
    id: "insurance_planning",
    keywords: ["insurance", "term insurance", "health insurance", "endowment", "lic", "medical claim", "बीमा", "जीवन बीमा", "स्वास्थ्य बीमा", "विमा"],
    subCategory: "Insurance & Security",
    responses: {
      "en-IN": {
        answer: "Keep insurance and investments separate. Opt for a Pure Term Insurance plan with 10-15x your annual salary cover, and a separate Health Insurance plan.",
        reasoning: [
          { title: "Pure Term Plan", detail: "Offers high life cover at extremely low premiums. Avoid endowment policies which offer low returns and low insurance covers." },
          { title: "Health Cover", detail: "A minimum base health plan of ₹5 Lakhs to ₹10 Lakhs is essential to protect your emergency savings from hospital bills." },
          { title: "Critical Illness Rider", detail: "Adds an extra layer of payout in case of severe medical diagnoses to cover loss of income." }
        ]
      },
      "hi-IN": {
        answer: "बीमा और निवेश को हमेशा अलग रखें। अपने वार्षिक वेतन का 10-15 गुना कवर देने वाला प्योर टर्म इंश्योरेंस प्लान और एक स्वतंत्र हेल्थ इंश्योरेंस प्लान चुनें।",
        reasoning: [
          { title: "टर्म इंश्योरेंस", detail: "बहुत कम प्रीमियम पर बड़ा जीवन बीमा कवर देता है। मनी-बैक या एंडोमेंट पॉलिसियों से बचें।" },
          { title: "स्वास्थ्य बीमा आवश्यकता", detail: "कम से कम ₹5 से ₹10 लाख का मेडिकल कवर होना चाहिए, ताकि इलाज के खर्चों से आपकी बचत सुरक्षित रहे।" }
        ]
      },
      "mr-IN": {
        answer: "विमा आणि गुंतवणूक कधीही एकत्र करू नका. कुटुंबाच्या सुरक्षेसाठी वार्षिक पगाराच्या किमान १० ते १५ पट टर्म इन्शुरन्स आणि योग्य आरोग्य विमा घ्यावा.",
        reasoning: [
          { title: "टर्म प्लॅन", detail: "कमी प्रीमियममध्ये सर्वात मोठा विमा संरक्षण देणारा पर्याय." }
        ]
      }
    }
  },
  {
    id: "phishing_and_security",
    keywords: ["security", "fraud", "phishing", "scam", "otp", "password", "hack", "kyc fraud", "धोखाधड़ी", "धोका", "सुरक्षा", "ओटीपी", "पासवर्ड"],
    subCategory: "Security & Fraud Alert",
    responses: {
      "en-IN": {
        answer: "Keep your bank accounts secure by never sharing your OTP, PIN, or CVV. Banks will never call you to ask for password details or prompt remote screen-sharing apps.",
        reasoning: [
          { title: "OTP/PIN Protection", detail: "Never input your transaction PIN or OTP on links received via SMS/WhatsApp or share them over calls." },
          { title: "Two-Factor Authentication", detail: "Enable 2FA on all banking, email, and social apps. Use app-based authenticators over standard SMS." },
          { title: "Report Immediately", detail: "If you detect any unauthorized transaction, report to national cybercrime helpline (1930) or your bank within 3 hours." }
        ]
      },
      "hi-IN": {
        answer: "अपना ओटीपी (OTP), पिन (PIN) या सीवीवी (CVV) कभी किसी के साथ साझा न करें। बैंक कभी भी फोन पर पासवर्ड नहीं मांगते और न ही रिमोट स्क्रीन-शेयरिंग ऐप्स डाउनलोड करवाते हैं।",
        reasoning: [
          { title: "ओटीपी/पिन सुरक्षा", detail: "एसएमएस/व्हाट्सएप पर मिले संदिग्ध लिंक पर कभी भी अपना यूपीआई पिन दर्ज न करें।" },
          { title: "साइबर फ्रॉड हेल्पलाइन", detail: "धोखाधड़ी होने पर तुरंत 1930 नंबर पर शिकायत दर्ज करें या 3 घंटे के भीतर बैंक को सूचित करें।" }
        ]
      },
      "mr-IN": {
        answer: "सुरक्षित बँकिंगसाठी तुमचा OTP, PIN किंवा CVV कोणालाही सांगू नका. बँक कधीही अशा संवेदनशील गोष्टींची मागणी करत नाही.",
        reasoning: [
          { title: "सुरक्षा खबरदारी", detail: "कोणत्याही अनोळखी लिंकवर क्लिक करून व्यवहार करू नका." }
        ]
      }
    }
  }
];

// Offline matching algorithm
// Uses keyword score weighting to find the best match for the user's banking query.
// Supports multi-turn contextual tracking by referencing recent messages in the conversation history.
export function matchAdvisorQuery(
  query: string,
  selectedLang: string = "en-IN",
  contextHistory: { text: string; sender: "user" | "ai" }[] = []
): AdvisorResponse {
  const cleanQuery = query.toLowerCase().trim();
  let bestIntent: IntentConfig | null = null;
  let maxScore = 0;

  // Simple tokenizing
  const queryTokens = cleanQuery.split(/[\s,?.!/\\_+-]+/);

  // Scan recent history to detect ongoing context (limit to last 3 messages for relevancy)
  const recentHistory = contextHistory.slice(-3).map(m => m.text.toLowerCase());
  const contextTags = {
    loan: recentHistory.some(h => h.includes("loan") || h.includes("emi") || h.includes("borrow")),
    sip: recentHistory.some(h => h.includes("sip") || h.includes("invest") || h.includes("fund")),
    budget: recentHistory.some(h => h.includes("save") || h.includes("saving") || h.includes("spend") || h.includes("expense")),
    tax: recentHistory.some(h => h.includes("tax") || h.includes("80c") || h.includes("income tax")),
  };

  for (const intent of advisorIntents) {
    let score = 0;
    
    // Check keyword overlaps
    for (const kw of intent.keywords) {
      if (cleanQuery.includes(kw)) {
        score += 5; // substring match gets high base
      }
      
      // Token overlap
      for (const token of queryTokens) {
        if (token === kw) {
          score += 3;
        }
      }
    }

    // Contextual boost (Multi-turn tracking)
    if (intent.id === "loan_affordability" && contextTags.loan) {
      score += 4;
    }
    if (intent.id === "sip_investment" && contextTags.sip) {
      score += 4;
    }
    if (intent.id === "budget_optimization" && contextTags.budget) {
      score += 4;
    }
    if (intent.id === "tax_planning" && contextTags.tax) {
      score += 4;
    }

    if (score > maxScore) {
      maxScore = score;
      bestIntent = intent;
    }
  }

  // Fallback translation mappings
  const fallbacks: Record<string, AdvisorResponse> = {
    "en-IN": {
      answer: "That's a helpful question. As an offline advisor, I suggest reviewing this under savings or budgeting guidelines. What specific area are you looking to optimize?",
      reasoning: [
        { title: "Check budget limits", detail: "Review transaction lists to find out where your funds are heading." },
        { title: "Consult support", detail: "Reach out to your local IDBI branch for personalized financial assistance." }
      ]
    },
    "hi-IN": {
      answer: "यह एक महत्वपूर्ण प्रश्न है। ऑफलाइन सलाहकार के रूप में, मैं आपकी बचत या बजट दिशानिर्देशों के तहत इसकी समीक्षा करने का सुझाव देता हूं। आप विशेष रूप से किस क्षेत्र में निवेश या सुधार करना चाहते हैं?",
      reasoning: [
        { title: "बजट सीमा की जांच करें", detail: "लेन-देन की सूची की जांच करें कि आपका पैसा कहां खर्च हो रहा है।" }
      ]
    },
    "mr-IN": {
      answer: "हा एक चांगला प्रश्न आहे. एक ऑफलाइन सल्लागार म्हणून, मी तुम्हाला बजेट किंवा गुंतवणुकीच्या पर्यायांमध्ये याची पडताळणी करण्याचा सल्ला देतो.",
      reasoning: [
        { title: "बचत वाढवा", detail: "पगार येताच गुंतवणुकीसाठी काही रक्कम बाजूला काढा." }
      ]
    }
  };

  const currentLang = fallbacks[selectedLang] ? selectedLang : "en-IN";
  const defaultFallback = fallbacks[currentLang];

  if (!bestIntent || maxScore < 2) {
    // Attempt context-based fallback if user says something generic like "tell me more" or "how"
    if (contextTags.loan) {
      const loanIntent = advisorIntents.find(i => i.id === "loan_affordability")!;
      const localized = loanIntent.responses[selectedLang] || loanIntent.responses["en-IN"];
      return { answer: `Following up on loans: ${localized.answer}`, reasoning: localized.reasoning };
    }
    if (contextTags.sip) {
      const sipIntent = advisorIntents.find(i => i.id === "sip_investment")!;
      const localized = sipIntent.responses[selectedLang] || sipIntent.responses["en-IN"];
      return { answer: `Regarding investments: ${localized.answer}`, reasoning: localized.reasoning };
    }
    return defaultFallback;
  }

  const localizedData = bestIntent.responses[selectedLang] || bestIntent.responses["en-IN"];
  
  return {
    answer: localizedData.answer,
    reasoning: localizedData.reasoning,
    addons: bestIntent.addons ? { type: bestIntent.addons(cleanQuery).type, data: bestIntent.addons(cleanQuery).data } : undefined
  };
}
