import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, Clock, MessageSquare, RefreshCw, Save, Send, Settings, Users } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';

// Template options
const TEMPLATE_OPTIONS = [
  { id: 1, name: 'Raffle Winner Announcement', subject: 'Congratulations! You won the raffle!' },
  { id: 2, name: 'New Raffle Notification', subject: 'New Pokémon Card Raffle Now Available!' },
  { id: 3, name: 'Abandoned Cart Reminder', subject: 'Complete Your Raffle Ticket Purchase' },
  { id: 4, name: 'Weekly Newsletter', subject: 'This Week\'s Hottest Raffles and Winners' },
  { id: 5, name: 'Profile Completion Reminder', subject: 'Complete Your Profile for Better Chances!' }
];

// Audience options
const AUDIENCE_OPTIONS = [
  { id: 1, name: 'All Subscribers', count: 1254 },
  { id: 2, name: 'Active Participants', count: 876 },
  { id: 3, name: 'Recent Winners', count: 87 },
  { id: 4, name: 'Inactive Users (30+ days)', count: 432 },
  { id: 5, name: 'High Value Customers', count: 192 }
];

const UserCommunicationStrategy: React.FC = () => {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedAudience, setSelectedAudience] = useState<string>('');
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [enablePersonalization, setEnablePersonalization] = useState(true);
  const [enableAnalytics, setEnableAnalytics] = useState(true);
  
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = TEMPLATE_OPTIONS.find(t => t.id.toString() === templateId);
    if (template) {
      setSubject(template.subject);
      
      // Set dummy content based on the template
      if (template.id === 1) {
        setMessageContent(`Hello {first_name},

Congratulations! You've won our {raffle_name} raffle! 

Your winning ticket number was {ticket_number}. You can now purchase this amazing Pokémon card at 40% off the retail price.

To claim your prize, please log in to your account and follow the instructions on your dashboard. You have 48 hours to claim your prize before it's offered to another participant.

Best regards,
The BitMonTCG Team`);
      } else if (template.id === 2) {
        setMessageContent(`Hello {first_name},

We're excited to announce a new raffle featuring {card_name}!

This {rarity} card is valued at ${Math.floor(Math.random() * 200 + 100)}, but you could win the chance to purchase it for just ${Math.floor(Math.random() * 100 + 50)}!

Raffle Details:
- Card: {card_name}
- Condition: {condition}
- Retail Price: ${Math.floor(Math.random() * 200 + 100)}
- Winner Price: ${Math.floor(Math.random() * 100 + 50)}
- Tickets: Only {ticket_count} available!

Don't miss your chance! Tickets are selling fast.

Best regards,
The BitMonTCG Team`);
      } else {
        setMessageContent(`Hello {first_name},

This is a template message for ${template.name}.

You can customize this content to suit your needs. 

Best regards,
The BitMonTCG Team`);
      }
    }
  };
  
  const handleAudienceSelect = (audienceId: string) => {
    setSelectedAudience(audienceId);
  };
  
  const handleSendTestEmail = () => {
    if (!subject || !messageContent) {
      toast({
        title: 'Missing Information',
        description: 'Please complete the subject and message content.',
        variant: 'destructive'
      });
      return;
    }
    
    toast({
      title: 'Test Email Sent',
      description: 'A test email has been sent to your admin email address.'
    });
  };
  
  const handleSaveTemplate = () => {
    if (!subject || !messageContent) {
      toast({
        title: 'Missing Information',
        description: 'Please complete the subject and message content.',
        variant: 'destructive'
      });
      return;
    }
    
    toast({
      title: 'Template Saved',
      description: 'Your communication template has been saved.'
    });
  };
  
  const handleScheduleCampaign = () => {
    if (!subject || !messageContent || !selectedAudience || !scheduleDate) {
      toast({
        title: 'Missing Information',
        description: 'Please complete all required fields to schedule your campaign.',
        variant: 'destructive'
      });
      return;
    }
    
    const audienceName = AUDIENCE_OPTIONS.find(a => a.id.toString() === selectedAudience)?.name;
    
    toast({
      title: 'Campaign Scheduled',
      description: `Your campaign has been scheduled for ${format(scheduleDate, 'PPP')} to ${audienceName}.`
    });
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Communication Strategy</CardTitle>
            <CardDescription>
              Create, manage, and schedule communications to your users
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="compose">
          <TabsList className="mb-4">
            <TabsTrigger value="compose">
              <MessageSquare className="h-4 w-4 mr-2" />
              Compose
            </TabsTrigger>
            <TabsTrigger value="audience">
              <Users className="h-4 w-4 mr-2" />
              Audience
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <Clock className="h-4 w-4 mr-2" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="compose" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template">Email Template</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_OPTIONS.map(template => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input 
                id="subject" 
                placeholder="Enter email subject" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="message">Message Content</Label>
                <div className="text-xs text-muted-foreground">
                  Use {"{first_name}"} for personalization
                </div>
              </div>
              <Textarea 
                id="message" 
                placeholder="Enter your message" 
                rows={10}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleSendTestEmail}>
                Send Test Email
              </Button>
              <Button variant="outline" onClick={handleSaveTemplate}>
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="audience" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="audience">Select Target Audience</Label>
              <Select value={selectedAudience} onValueChange={handleAudienceSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an audience" />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_OPTIONS.map(audience => (
                    <SelectItem key={audience.id} value={audience.id.toString()}>
                      {audience.name} ({audience.count} users)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="rounded-md border p-4">
              <h3 className="text-sm font-medium mb-2">Audience Insights</h3>
              {selectedAudience ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted rounded-md p-3">
                      <div className="text-sm text-muted-foreground">Open Rate</div>
                      <div className="text-lg font-semibold">{Math.floor(Math.random() * 30 + 50)}%</div>
                    </div>
                    <div className="bg-muted rounded-md p-3">
                      <div className="text-sm text-muted-foreground">Click Rate</div>
                      <div className="text-lg font-semibold">{Math.floor(Math.random() * 20 + 10)}%</div>
                    </div>
                  </div>
                  <div className="bg-muted rounded-md p-3">
                    <div className="text-sm text-muted-foreground">Best Send Time</div>
                    <div className="text-lg font-semibold">
                      {Math.floor(Math.random() * 3 + 9)}am - {Math.floor(Math.random() * 4 + 1)}pm
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Select an audience to view insights
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="schedule" className="space-y-4">
            <div className="space-y-2">
              <Label>Schedule Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduleDate ? format(scheduleDate, 'PPP') : <span>Select a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={scheduleDate}
                    onSelect={setScheduleDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Send Time</Label>
              <Select defaultValue="10">
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }).map((_, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {index === 0 ? '12:00 AM' :
                        index < 12 ? `${index}:00 AM` :
                        index === 12 ? '12:00 PM' :
                        `${index - 12}:00 PM`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="optimize-timing">Optimize Send Time</Label>
                <Switch id="optimize-timing" defaultChecked />
              </div>
              <p className="text-sm text-muted-foreground">
                Our system will automatically send at the optimal time for each recipient.
              </p>
            </div>
            
            <Button onClick={handleScheduleCampaign} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              Schedule Campaign
            </Button>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="personalization">Enable Personalization</Label>
                  <Switch 
                    id="personalization" 
                    checked={enablePersonalization}
                    onCheckedChange={setEnablePersonalization}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Add personalized fields like recipient's name to your emails.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="analytics">Enable Analytics Tracking</Label>
                  <Switch 
                    id="analytics" 
                    checked={enableAnalytics}
                    onCheckedChange={setEnableAnalytics}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Track opens, clicks, and other engagement metrics.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="unsubscribe">Include Unsubscribe Link</Label>
                  <Switch id="unsubscribe" defaultChecked disabled />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Required by anti-spam regulations. Cannot be disabled.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <Label htmlFor="sender-name">Default Sender Name</Label>
                <Input id="sender-name" defaultValue="BitMonTCG Team" className="mt-1" />
              </div>
              
              <div>
                <Label htmlFor="reply-to">Reply-To Email</Label>
                <Input id="reply-to" defaultValue="BitMonTCG@gmail.com" className="mt-1" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t pt-6 flex justify-between">
        <div className="text-sm text-muted-foreground">
          All communications comply with CAN-SPAM regulations.
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset Form
        </Button>
      </CardFooter>
    </Card>
  );
};

export default UserCommunicationStrategy;
