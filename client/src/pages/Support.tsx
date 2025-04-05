import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/hooks/use-auth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const supportFormSchema = z.object({
  subject: z.string().min(5, {
    message: "Subject must be at least 5 characters long",
  }),
  message: z.string().min(20, {
    message: "Message must be at least 20 characters long",
  }),
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
});

const Support = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuthContext();

  const form = useForm<z.infer<typeof supportFormSchema>>({
    resolver: zodResolver(supportFormSchema),
    defaultValues: {
      subject: "",
      message: "",
      email: user?.email || "",
    },
  });

  async function onSubmit(values: z.infer<typeof supportFormSchema>) {
    try {
      setIsSubmitting(true);
      // In a real application, we would send this to a backend API
      // For now, we'll just simulate a delay and show a success message
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Support request sent",
        description: "We'll get back to you as soon as possible.",
      });
      
      form.reset({
        subject: "",
        message: "",
        email: user?.email || "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send support request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const faqs = [
    {
      question: "How do I place a bet?",
      answer: "To place a bet, choose a betting option (number, color, or size), enter your bet amount, and click the 'Place Bet' button. Make sure you have sufficient balance in your account."
    },
    {
      question: "What are the different betting options?",
      answer: "There are three main betting options: Numbers (0-9), Colors (Green, Red, Violet), and Sizes (Big: 5-9, Small: 0-4). Each option has different payout rates."
    },
    {
      question: "How are the results determined?",
      answer: "Results are randomly generated at the end of each round. The countdown timer shows when the next result will be revealed. Each number has an associated color and size."
    },
    {
      question: "What are the payout multipliers?",
      answer: "Number bets pay 10x your bet amount. Color bets pay 2x for Red and Green, and 3x for Violet. Size bets (Big or Small) pay 2x your bet amount."
    },
    {
      question: "How do I deposit money?",
      answer: "Currently, new accounts start with $1,000 in play money. In a real implementation, you would have deposit options through various payment methods."
    },
    {
      question: "I encountered a technical issue, what should I do?",
      answer: "If you experience any technical issues, please use the support form on this page to describe the problem in detail. Our team will investigate and respond as soon as possible."
    },
    {
      question: "Are there any betting limits?",
      answer: "Yes, the minimum bet amount is $10 and the maximum bet amount is $10,000 per bet."
    },
    {
      question: "Can I cancel a bet after placing it?",
      answer: "No, once a bet is placed, it cannot be canceled. Please double-check your bet details before confirming."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-montserrat">Support Center</CardTitle>
          <CardDescription>Need help? Browse our FAQ or submit a support request.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Support</h3>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Your email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="What is your question about?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Please describe your issue or question in detail" 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-[#3f51b5] hover:bg-[#3f51b5]/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </Form>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Frequently Asked Questions</h3>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left font-medium">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-gray-600">{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-montserrat">Our Support Team</CardTitle>
          <CardDescription>We're here to help you 24/7</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-blue-100 mx-auto mb-3 flex items-center justify-center">
                <span className="material-icons text-blue-600">headset_mic</span>
              </div>
              <h4 className="font-medium">Live Chat</h4>
              <p className="text-sm text-gray-600 mt-1">Available 24/7 for immediate assistance</p>
              <Button variant="outline" className="mt-3 w-full">
                Start Chat
              </Button>
            </div>
            
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-green-100 mx-auto mb-3 flex items-center justify-center">
                <span className="material-icons text-green-600">email</span>
              </div>
              <h4 className="font-medium">Email Support</h4>
              <p className="text-sm text-gray-600 mt-1">Response within 24 hours</p>
              <Button variant="outline" className="mt-3 w-full">
                support@betmaster.com
              </Button>
            </div>
            
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-purple-100 mx-auto mb-3 flex items-center justify-center">
                <span className="material-icons text-purple-600">help_center</span>
              </div>
              <h4 className="font-medium">Help Center</h4>
              <p className="text-sm text-gray-600 mt-1">Browse our knowledge base</p>
              <Button variant="outline" className="mt-3 w-full">
                Visit Help Center
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="text-center max-w-xl mx-auto">
          <h3 className="text-xl font-semibold mb-3">BetMaster Community</h3>
          <p className="text-gray-600 mb-4">
            Join our community forums to discuss strategies, share experiences, and connect with other players.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" className="flex items-center">
              <span className="material-icons mr-2">forum</span>
              <span>Community Forum</span>
            </Button>
            <Button variant="outline" className="flex items-center">
              <span className="material-icons mr-2">discord</span>
              <span>Discord Server</span>
            </Button>
            <Button variant="outline" className="flex items-center">
              <span className="material-icons mr-2">twitter</span>
              <span>Twitter</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
