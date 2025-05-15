import React from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy, Check, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const HowToBuyCrypto: React.FC = () => {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);
  
  // Binance referral code
  const referralCode = "12345678"; // Replace with actual referral code
  const referralLink = `https://www.binance.com/en/register?ref=${referralCode}`;
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast({
      title: "Referral code copied!",
      description: "The referral code has been copied to your clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const platforms = [
    {
      name: "Binance",
      logo: "https://public.bnbstatic.com/20190405/eb2349c3-b2f8-4a93-a286-8f86a62ea9d8.png",
      description: "The world's largest crypto exchange by trading volume. Offers a wide range of cryptocurrencies.",
      link: referralLink,
      steps: [
        "Create a Binance account using our referral link below",
        "Complete identity verification (KYC)",
        "Add payment method (credit card, bank transfer, etc.)",
        "Purchase cryptocurrency",
        "Transfer cryptocurrency to your BitMonTCG wallet address"
      ],
      discount: "Get 20% off trading fees with our referral code!"
    },
    {
      name: "Shakepay",
      logo: "https://assets-global.website-files.com/5e6f7a9b7b6c8c7a5e3c0e4c/5e6f7a9b7b6c8c7a5e3c0e4d_shakepay-logo.png",
      description: "Popular Canadian platform for buying Bitcoin and Ethereum with fast e-Transfers.",
      link: "https://shakepay.me/r/REFERRALCODE", // Replace with actual referral code
      steps: [
        "Sign up for Shakepay using our referral link",
        "Verify your identity (KYC)",
        "Add funds via Interac e-Transfer",
        "Buy Bitcoin or Ethereum",
        "Send crypto to your BitMonTCG wallet address"
      ],
      discount: "Get a $10 bonus when you buy your first $100 of crypto!"
    },
    {
      name: "Newton",
      logo: "https://assets-global.website-files.com/5e6f7a9b7b6c8c7a5e3c0e4c/5e6f7a9b7b6c8c7a5e3c0e4e_newton-logo.png",
      description: "Zero-fee Canadian exchange with a wide selection of cryptocurrencies.",
      link: "https://web.newton.co/r/REFERRALCODE", // Replace with actual referral code
      steps: [
        "Register for Newton using our referral link",
        "Complete verification (KYC)",
        "Fund your account via e-Transfer or wire",
        "Buy your preferred cryptocurrency",
        "Transfer to your BitMonTCG wallet address"
      ],
      discount: "Earn $25 in Bitcoin after your first trade!"
    },
    {
      name: "NDAX",
      logo: "https://www.ndax.io/assets/images/logo-ndax.svg",
      description: "Canadian exchange with low fees and advanced trading features.",
      link: "https://ndax.io/?referral=REFERRALCODE", // Replace with actual referral code
      steps: [
        "Open an NDAX account using our referral link",
        "Verify your identity",
        "Deposit funds via e-Transfer or wire",
        "Purchase cryptocurrency",
        "Withdraw to your BitMonTCG wallet address"
      ],
      discount: "Get $10 bonus after your first $100 trade!"
    },
    {
      name: "Coinbase",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Coinbase_logo.svg/1200px-Coinbase_logo.svg.png",
      description: "User-friendly platform ideal for beginners. Easy to use with strong security features.",
      link: "https://www.coinbase.com/",
      steps: [
        "Sign up for a Coinbase account",
        "Complete identity verification",
        "Connect your bank account or credit card",
        "Purchase cryptocurrency",
        "Transfer cryptocurrency to your BitMonTCG wallet address"
      ]
    },
    {
      name: "Kraken",
      logo: "https://assets.kraken.com/partners/pro/downloads/kraken-logo-wordmark-dark-transparent.png",
      description: "Established exchange with strong security track record and moderate fees.",
      link: "https://www.kraken.com/",
      steps: [
        "Create a Kraken account",
        "Complete verification process",
        "Deposit funds via wire transfer or cryptocurrency",
        "Purchase desired cryptocurrency",
        "Transfer cryptocurrency to your BitMonTCG wallet address"
      ]
    }
  ];

  const tips = [
    {
      title: "Security First",
      content: "Enable two-factor authentication (2FA) on all your accounts and never share your private keys or seed phrases with anyone."
    },
    {
      title: "Start Small",
      content: "If you're new to cryptocurrency, start with small amounts until you're comfortable with the process."
    },
    {
      title: "Market Volatility",
      content: "Cryptocurrency prices can be highly volatile. Only invest what you can afford to lose."
    },
    {
      title: "Research",
      content: "Understand the basics of blockchain and cryptocurrency before investing significant amounts."
    }
  ];

  return (
    <>
      <Helmet>
        <title>How to Buy Cryptocurrency | BitMonTCG Raffles</title>
        <meta name="description" content="Learn how to buy cryptocurrency for BitMonTCG raffles with our step-by-step guide." />
      </Helmet>

      <div className="container max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            How to Buy Cryptocurrency
          </motion.h1>
          <motion.p 
            className="text-xl text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            A beginner-friendly guide to purchasing cryptocurrency for BitMonTCG raffles
          </motion.p>
        </div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-10"
        >
          <Card>
            <CardHeader>
              <CardTitle>Getting Started with Cryptocurrency</CardTitle>
              <CardDescription>
                Cryptocurrency is a digital form of currency that uses cryptography for security and operates on decentralized networks. To participate in BitMonTCG raffles, you'll need to purchase cryptocurrency and transfer it to your wallet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Follow this guide to learn how to buy cryptocurrency for the first time. We've partnered with several platforms to make this process as smooth as possible for our community.
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-2">Why Use Cryptocurrency?</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 mr-2 flex-shrink-0 text-primary" />
                    <span>Lower transaction fees compared to traditional payment methods</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 mr-2 flex-shrink-0 text-primary" />
                    <span>Faster processing times, especially for international transactions</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 mr-2 flex-shrink-0 text-primary" />
                    <span>Enhanced privacy and security for your purchases</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 mr-2 flex-shrink-0 text-primary" />
                    <span>Access to exclusive crypto-only raffles and promotions</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Platforms */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6">Recommended Platforms</h2>
          <div className="grid gap-6 md:grid-cols-1">
            {platforms.map((platform, index) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center space-x-4">
                    <img 
                      src={platform.logo} 
                      alt={`${platform.name} logo`} 
                      className="h-10 object-contain"
                    />
                    <div>
                      <CardTitle>{platform.name}</CardTitle>
                      <CardDescription>{platform.description}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-medium mb-3">Step-by-Step Guide:</h3>
                    <ol className="list-decimal pl-5 mb-4 space-y-2">
                      {platform.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                    {platform.discount && (
                      <div className="bg-primary/10 text-primary p-3 rounded-md mb-4">
                        {platform.discount}
                      </div>
                    )}
                    <Button asChild className="w-full">
                      <a href={platform.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                        Visit {platform.name}
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Referral Code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mb-10"
        >
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Exclusive Binance Referral Code</CardTitle>
              <CardDescription>
                Use our referral code when signing up for Binance to receive 20% off trading fees!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="bg-muted p-3 rounded-md flex-1 font-mono text-center text-lg">
                  {referralCode}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  className="flex-shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button asChild className="w-full mt-4">
                <a href={referralLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                  Sign Up with Referral Link
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <h2 className="text-2xl font-bold mb-6">Safety Tips</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {tips.map((tip, index) => (
              <Card key={tip.title}>
                <CardHeader>
                  <CardTitle className="text-lg">{tip.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{tip.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default HowToBuyCrypto;
