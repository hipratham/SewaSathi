
"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { mockServiceRequests, mockServiceProviders } from "@/lib/mock-data"; 
import type { ServiceRequest, ServiceRequestStatus, ServiceProvider, ServiceProviderAvailability, ServiceProviderRates } from "@/lib/types";
import { COMMISSION_RATE } from "@/lib/types";
import { AlertCircle, CheckCircle, Clock, DollarSign, Eye, MessageSquare, XCircle, Info, LayoutDashboard, Hourglass, UserCog, UserCheck, Briefcase, FileText, Users, ListChecks, User as UserIcon, Settings, Banknote, CalendarDays, Receipt, ThumbsUp, ThumbsDown, AlertTriangle, WalletCards, Edit3, History, SendHorizonal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ServiceRequestForm from "@/components/providers/service-request-form"; // For Send Offer modal

// Helper function to find provider name from mock data
const getProviderName = (providerId: string | null | undefined, providers: ServiceProvider[]): string => {
  if (!providerId) return "N/A";
  const provider = providers.find(p => p.id === providerId);
  return provider ? provider.name : "Unknown Provider";
};

const getSeekerName = (seekerId: string | null | undefined, offers: ServiceRequest[]): string => {
  if (!seekerId) return "N/A";
  const offer = offers.find(o => o.userId === seekerId);
  return offer ? offer.clientName : "Unknown Seeker";
}

// Helper function to format availability for Admin Dashboard
const formatAvailabilityForAdmin = (availability?: ServiceProviderAvailability): string => {
  if (!availability) return "Not specified";
  let parts: string[] = [];
  if (availability.days && availability.days.length > 0) {
    parts.push(`Days: ${availability.days.join(', ')}`);
  }
  if (availability.startTime && availability.endTime) {
    parts.push(`Hours: ${availability.startTime} - ${availability.endTime}`);
  } else if (availability.startTime) {
    parts.push(`Starts: ${availability.startTime}`);
  } else if (availability.endTime) {
    parts.push(`Ends by: ${availability.endTime}`);
  }
  
  let fullString = parts.join(' | ');
  if (!fullString && availability.notes) return `Notes: ${availability.notes}`;
  if (fullString && availability.notes) fullString += ` (Notes: ${availability.notes})`;
  return fullString || "Availability not fully specified.";
};

// Helper function to format rates for Admin Dashboard
const formatRatesForAdmin = (rates: ServiceProviderRates): React.ReactNode => {
  const { type, amount, minAmount, maxAmount, details } = rates;
  let rateString = "";

  switch (type) {
    case "per-hour":
      rateString = amount ? `Rs. ${amount} per hour` : "Hourly rate (details not specified)";
      break;
    case "per-job":
      rateString = amount ? `Approx. Rs. ${amount} per job` : "Per job basis (details not specified)";
      break;
    case "fixed-project":
      rateString = amount ? `Rs. ${amount} (fixed project price)` : "Fixed project price (details not specified)";
      break;
    case "varies":
      if (minAmount && maxAmount) rateString = `Rs. ${minAmount} - Rs. ${maxAmount}`;
      else rateString = "Rates vary / Upon Consultation";
      break;
    case "free-consultation":
      rateString = "Offers Free Consultation";
      break;
    default:
      rateString = "Please contact for rate information.";
  }

  return (
    <>
      <p className="font-semibold">{rateString}</p>
      {details && (
        <p className="text-xs text-muted-foreground mt-1"><em>Note: {details}</em></p>
      )}
    </>
  );
};

const getStatusBadgeVariant = (status: ServiceRequestStatus) => {
    switch (status) {
        case "offer_sent_to_provider": return "secondary";
        case "offer_declined_by_provider": return "destructive";
        case "offer_accepted_by_provider_pending_payment": return "warning"; // You might need to define a 'warning' variant for Badge
        case "payment_submitted_pending_admin_approval": return "info"; // And 'info'
        case "admin_approved_contact_unlocked": return "success"; // And 'success'
        case "admin_rejected_payment": return "destructive";
        case "job_completed": return "outline";
        default: return "default";
    }
};


export default function DashboardPage() {
  const { user, role, loading } = useAuth();
  const { toast } = useToast();
  
  // Use local state for serviceRequests to simulate updates
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>(mockServiceRequests);
  const [localServiceProviders, setLocalServiceProviders] = useState<ServiceProvider[]>(mockServiceProviders);


  // Provider specific state
  const [offerToAcceptOrDecline, setOfferToAcceptOrDecline] = useState<ServiceRequest | null>(null);
  const [showCommissionPaymentDialog, setShowCommissionPaymentDialog] = useState(false);
  const [providerDeclineReason, setProviderDeclineReason] = useState("");
  const [offerToDecline, setOfferToDecline] = useState<ServiceRequest | null>(null);

  // Admin specific state
  const [showAdminRejectionDialog, setShowAdminRejectionDialog] = useState(false);
  const [adminRejectionReasonInput, setAdminRejectionReasonInput] = useState("");
  const [offerToVerifyByAdmin, setOfferToVerifyByAdmin] = useState<ServiceRequest | null>(null);

  // Seeker specific state
  const [showSendOfferModal, setShowSendOfferModal] = useState(false);
  const [selectedProviderForOffer, setSelectedProviderForOffer] = useState<ServiceProvider | null>(null);


  const updateOfferStatusLocally = (offerId: string, newStatus: ServiceRequestStatus, updates?: Partial<ServiceRequest>) => {
    setServiceRequests(prevOffers =>
      prevOffers.map(offer =>
        offer.id === offerId ? { ...offer, status: newStatus, ...updates } : offer
      )
    );
    // TODO: Implement actual Firebase update here
  };

  // --- Provider Actions ---
  const handleProviderAcceptOffer = (offer: ServiceRequest) => {
    if (!offer.budget) {
        toast({variant: "destructive", title: "Budget Missing", description: "Cannot accept offer without a budget specified by seeker."});
        return;
    }
    const commission = offer.budget * COMMISSION_RATE;
    updateOfferStatusLocally(offer.id, "offer_accepted_by_provider_pending_payment", { commissionAmount: commission });
    setOfferToAcceptOrDecline(offer); // Keep offer context for payment dialog
    setShowCommissionPaymentDialog(true);
    toast({ title: "Offer Accepted!", description: "Please proceed to pay the commission." });
  };

  const handleProviderPaidCommission = () => {
    if (!offerToAcceptOrDecline) return;
    // Simulate payment reference
    const paymentRef = `ESW-MOCK-${Date.now().toString().slice(-6)}`;
    updateOfferStatusLocally(offerToAcceptOrDecline.id, "payment_submitted_pending_admin_approval", { paymentReference: paymentRef });
    setShowCommissionPaymentDialog(false);
    setOfferToAcceptOrDecline(null);
    toast({ title: "Payment Submitted", description: "Admin will verify your payment shortly." });
  };

  const handleProviderOpenDeclineDialog = (offer: ServiceRequest) => {
    setOfferToDecline(offer);
    setProviderDeclineReason("");
  };
  
  const handleProviderSubmitDecline = () => {
    if (!offerToDecline) return;
    updateOfferStatusLocally(offerToDecline.id, "offer_declined_by_provider", { providerRejectionReason: providerDeclineReason.trim() || "Declined without specific reason." });
    toast({ title: "Offer Declined", description: "The seeker has been notified." });
    setOfferToDecline(null);
  };

  const handleProviderResubmitPayment = (offer: ServiceRequest) => {
    // Resets to the state where provider needs to confirm payment again
    updateOfferStatusLocally(offer.id, "offer_accepted_by_provider_pending_payment");
    setOfferToAcceptOrDecline(offer);
    setShowCommissionPaymentDialog(true);
     toast({ title: "Resubmit Payment", description: "Please confirm your commission payment again." });
  };

  // --- Admin Actions ---
  const handleAdminApprovePayment = (offerId: string) => {
    updateOfferStatusLocally(offerId, "admin_approved_contact_unlocked", { adminFeePaid: true });
    toast({ title: "Payment Approved!", description: "Provider can now see seeker's contact details."});
  };

  const handleAdminOpenRejectDialog = (offer: ServiceRequest) => {
    setOfferToVerifyByAdmin(offer);
    setAdminRejectionReasonInput("");
    setShowAdminRejectionDialog(true);
  };

  const handleAdminSubmitRejection = () => {
    if (!offerToVerifyByAdmin || !adminRejectionReasonInput.trim()) {
      toast({ variant: "destructive", title: "Reason Required", description: "Please provide a reason for rejection."});
      return;
    }
    updateOfferStatusLocally(offerToVerifyByAdmin.id, "admin_rejected_payment", { adminRejectionReason: adminRejectionReasonInput.trim(), adminFeePaid: false });
    toast({ title: "Payment Rejected", description: "Provider has been notified."});
    setOfferToVerifyByAdmin(null);
    setShowAdminRejectionDialog(false);
  };
  
  // --- Seeker Actions ---
  const handleSeekerSendNewOffer = (offerData: ServiceRequest) => {
    setServiceRequests(prev => [offerData, ...prev]); // Add new offer to local state
    setShowSendOfferModal(false); // Close modal after submission
    setSelectedProviderForOffer(null);
    // Toast is handled by OfferForm itself on successful submission
  };


  // Memoized filtered lists for performance
  const demoProviderIdForFiltering = user?.role === 'provider' ? user.uid : "mock-provider-uid-1"; // Use actual UID if provider
  const seekerIdForFiltering = user?.role === 'seeker' ? user.uid : "seeker-uid-1"; // Use actual UID if seeker
  
  const providerNewOffers = useMemo(() => 
    serviceRequests.filter(req => req.providerId === demoProviderIdForFiltering && req.status === "offer_sent_to_provider"),
    [serviceRequests, demoProviderIdForFiltering]
  );
  const providerActiveOffers = useMemo(() =>
    serviceRequests.filter(req => req.providerId === demoProviderIdForFiltering && 
      (req.status === "offer_accepted_by_provider_pending_payment" || 
       req.status === "payment_submitted_pending_admin_approval" ||
       req.status === "admin_approved_contact_unlocked" ||
       req.status === "admin_rejected_payment")),
    [serviceRequests, demoProviderIdForFiltering]
  );
  const providerWorkHistory = useMemo(() => 
    serviceRequests.filter(req => req.providerId === demoProviderIdForFiltering && (req.status === "job_completed" || req.status === "offer_declined_by_provider")),
    [serviceRequests, demoProviderIdForFiltering]
  );

  const seekerSentOffers = useMemo(() =>
    serviceRequests.filter(req => req.userId === seekerIdForFiltering && 
      (req.status === "offer_sent_to_provider" || 
       req.status === "offer_accepted_by_provider_pending_payment" ||
       req.status === "payment_submitted_pending_admin_approval" ||
       req.status === "admin_approved_contact_unlocked" ||
       req.status === "admin_rejected_payment"
      )),
    [serviceRequests, seekerIdForFiltering]
  );
  const seekerOfferHistory = useMemo(() =>
    serviceRequests.filter(req => req.userId === seekerIdForFiltering && (req.status === "offer_declined_by_provider" || req.status === "job_completed")),
    [serviceRequests, seekerIdForFiltering]
  );

  const adminPendingPayments = useMemo(() => 
    serviceRequests.filter(req => req.status === "payment_submitted_pending_admin_approval"),
    [serviceRequests]
  );


  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Hourglass className="h-12 w-12 animate-spin text-primary" /> <p className="ml-4 text-lg text-muted-foreground">Loading dashboard...</p></div>;
  }

  // ADMIN DASHBOARD
  if (role === 'admin') {
    return (
      <div className="space-y-8 p-4 md:p-6">
        <Card className="shadow-lg border-primary/30">
          <CardHeader className="bg-primary/5 rounded-t-lg">
            <CardTitle className="flex items-center text-2xl md:text-3xl text-primary">
              <UserCog className="mr-3 h-7 w-7" />
              Admin Dashboard
            </CardTitle>
            <CardDescription className="text-md text-muted-foreground">
              Manage platform activities, offers, and provider payments.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <Tabs defaultValue="pending-payments" className="w-full">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-1 p-1 bg-muted rounded-lg mb-6">
                <TabsTrigger value="pending-payments" className="text-sm py-2.5">
                  <WalletCards className="mr-2 h-4 w-4"/>Pending Payments <Badge variant="destructive" className="ml-2">{adminPendingPayments.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="all-offers" className="text-sm py-2.5">
                  <ListChecks className="mr-2 h-4 w-4"/>All Offers
                </TabsTrigger>
                <TabsTrigger value="providers" className="text-sm py-2.5">
                  <Users className="mr-2 h-4 w-4"/>Service Providers
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending-payments" className="mt-0">
                <Card className="border-accent/30 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl text-accent">Provider Commission Payment Verification</CardTitle>
                    <CardDescription>Review and confirm provider commission payments for accepted offers.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {adminPendingPayments.length > 0 ? (
                      adminPendingPayments.map((offer) => (
                        <Card key={offer.id} className="shadow-md border hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-3 bg-muted/50 rounded-t-md">
                            <CardTitle className="text-lg text-primary-foreground bg-primary/90 px-4 py-2 rounded-t-md flex justify-between items-center -mx-4 -mt-3 mb-3">
                              <span>Offer ID: {offer.id.substring(0, 8)}...</span>
                               <Badge variant="secondary" className="capitalize bg-background text-primary font-semibold">
                                {offer.status.replace(/_/g, ' ')}
                               </Badge>
                            </CardTitle>
                            <CardDescription className="pt-1 text-sm">
                              Provider: {getProviderName(offer.providerId, localServiceProviders)} | Seeker: {offer.clientName}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="text-sm space-y-2 px-4 py-3">
                            <p><strong className="font-medium">Task:</strong> {offer.taskDetails.substring(0, 100)}...</p>
                            <p><strong className="font-medium">Budget:</strong> Rs. {offer.budget?.toFixed(2)}</p>
                            <p><strong className="font-medium">Commission (8%):</strong> Rs. {offer.commissionAmount?.toFixed(2)}</p>
                            <p><strong className="font-medium">Payment Ref (Simulated):</strong> {offer.paymentReference || "N/A"}</p>
                          </CardContent>
                          <CardFooter className="flex justify-end gap-2 px-4 py-3 border-t mt-2">
                            <Button variant="default" size="sm" onClick={() => handleAdminApprovePayment(offer.id)}>
                              <CheckCircle className="mr-2 h-4 w-4" /> Approve Payment
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleAdminOpenRejectDialog(offer)}>
                              <XCircle className="mr-2 h-4 w-4" /> Reject Payment
                            </Button>
                          </CardFooter>
                        </Card>
                      ))
                    ) : (
                      <Alert className="border-dashed">
                        <WalletCards className="h-4 w-4"/>
                        <AlertTitle>All Clear!</AlertTitle>
                        <AlertDescription>No pending payment verifications.</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="all-offers" className="mt-0">
                 <Card className="border-secondary/30 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl text-secondary-foreground flex items-center">
                        <ListChecks className="mr-2 h-5 w-5 text-secondary"/> All Offers & Requests
                    </CardTitle>
                    <CardDescription>Overview of all offers on the platform.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {serviceRequests.length > 0 ? (
                      serviceRequests.map((req) => (
                        <Card key={req.id} className="shadow-sm border hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-md flex justify-between items-center">
                              <span>Seeker: {req.clientName} (Offer ID: {req.id.substring(0,8)}...)</span>
                              <Badge variant={getStatusBadgeVariant(req.status)} className="capitalize text-xs px-2 py-0.5">
                                {req.status.replace(/_/g, ' ')}
                              </Badge>
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              <CalendarDays className="inline h-3.5 w-3.5 mr-1"/> Requested: {new Date(req.requestedAt).toLocaleString()}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="text-sm space-y-1.5 px-4 py-3">
                            <p><strong className="font-medium">Task:</strong> {req.taskDetails}</p>
                            {req.budget && <p><strong className="font-medium">Budget:</strong> Rs. {req.budget.toFixed(2)}</p>}
                            <p><strong className="font-medium">Seeker Contact:</strong> {req.clientPhone} | <strong className="font-medium">Address:</strong> {req.clientAddress}</p>
                            <Separator className="my-2.5"/>
                            <p><strong className="font-medium">Assigned Provider:</strong> {getProviderName(req.providerId, localServiceProviders)}</p>
                            {req.commissionAmount != null && <p><strong className="font-medium">Commission:</strong> Rs. {req.commissionAmount.toFixed(2)} (Paid & Approved: {req.adminFeePaid ? <CheckCircle className="inline h-4 w-4 text-green-600" /> : <XCircle className="inline h-4 w-4 text-red-600" />})</p>}
                            {req.status === 'admin_rejected_payment' && req.adminRejectionReason && (
                              <Alert variant="destructive" className="mt-2 text-xs p-3 rounded-md">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle className="text-sm font-semibold">Payment Rejected</AlertTitle>
                                <AlertDescription>Reason: {req.adminRejectionReason}</AlertDescription>
                              </Alert>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                       <Alert className="border-dashed">
                        <ListChecks className="h-4 w-4"/>
                        <AlertTitle>No Offers Yet</AlertTitle>
                        <AlertDescription>No offers found on the platform.</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="providers" className="mt-0">
                <Card className="border-secondary/30 shadow-md">
                  <CardHeader>
                     <CardTitle className="text-xl text-secondary-foreground flex items-center">
                        <Users className="mr-2 h-5 w-5 text-secondary"/>All Service Providers
                    </CardTitle>
                    <CardDescription>Overview of registered service providers.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {localServiceProviders.length > 0 ? (
                      localServiceProviders.map((provider) => (
                        <Card key={provider.id} className="shadow-sm border hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center text-primary">
                              <UserIcon className="mr-2 h-5 w-5" /> {provider.name}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              Category: {provider.category}{provider.category === 'other' && provider.otherCategoryDescription ? ` (${provider.otherCategoryDescription})` : ''} | ID: {provider.id.substring(0,15)}...
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="text-sm space-y-1.5 px-4 py-3">
                            <p><strong className="font-medium">Contact:</strong> {provider.contactInfo.phone} / {provider.contactInfo.email}</p>
                            <p><strong className="font-medium">Address:</strong> {provider.address}</p>
                            {provider.servicesOffered && provider.servicesOffered.length > 0 && (
                              <p><strong className="font-medium">Services:</strong> {provider.servicesOffered.join(", ")}</p>
                            )}
                             <p><strong className="font-medium">Availability:</strong> {formatAvailabilityForAdmin(provider.availability)}</p>
                            <div><strong className="font-medium">Rates:</strong> {formatRatesForAdmin(provider.rates)}</div>
                            <p><strong className="font-medium">Rating:</strong> {provider.overallRating.toFixed(1)} ({provider.reviews.length} reviews)</p>
                          </CardContent>
                          <CardFooter className="border-t mt-2 py-3 px-4">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/providers/${provider.id}`} className="flex items-center"> <Eye className="mr-2 h-4 w-4"/> View Full Public Profile</Link>
                            </Button>
                          </CardFooter>
                        </Card>
                      ))
                    ) : (
                       <Alert className="border-dashed">
                        <Users className="h-4 w-4"/>
                        <AlertTitle>No Providers Yet</AlertTitle>
                        <AlertDescription>No service providers found on the platform.</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Dialog open={showAdminRejectionDialog} onOpenChange={(isOpen) => { if (!isOpen) setOfferToVerifyByAdmin(null); setShowAdminRejectionDialog(isOpen); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">Reject Commission Payment</DialogTitle>
              <DialogDescription>
                Provide a reason for rejecting the payment for offer ID: {offerToVerifyByAdmin?.id.substring(0,8)}...
                (Provider: {getProviderName(offerToVerifyByAdmin?.providerId, localServiceProviders)})
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Label htmlFor="rejectionReasonAdmin" className="font-semibold">Rejection Reason</Label>
              <Textarea
                id="rejectionReasonAdmin"
                value={adminRejectionReasonInput}
                onChange={(e) => setAdminRejectionReasonInput(e.target.value)}
                placeholder="e.g., Payment not reflected, screenshot unclear, etc."
                className="min-h-[100px]"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button variant="destructive" onClick={handleAdminSubmitRejection}>Submit Rejection</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // PROVIDER DASHBOARD
  if (role === 'provider') {
    return (
      <div className="space-y-8 p-4 md:p-6">
        <Card className="shadow-lg border-primary/30">
          <CardHeader className="bg-primary/5 rounded-t-lg">
            <CardTitle className="flex items-center text-2xl md:text-3xl text-primary">
              <LayoutDashboard className="mr-3 h-7 w-7" /> Provider Dashboard
            </CardTitle>
            <CardDescription className="text-md text-muted-foreground">Manage your offers and profile.</CardDescription>
          </CardHeader>
        </Card>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground/90 flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary"/>New Offer Requests</h2>
          {providerNewOffers.length > 0 ? (
            <div className="space-y-4">
              {providerNewOffers.map((offer) => (
                <Card key={offer.id} className="shadow-md hover:shadow-lg transition-shadow border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-primary flex justify-between items-center">
                      <span>Offer from: {offer.clientName}</span>
                       <Badge variant={getStatusBadgeVariant(offer.status)} className="capitalize text-xs px-2 py-0.5">
                        {offer.status.replace(/_/g, ' ')}
                       </Badge>
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground mt-1">
                      <Clock className="inline h-4 w-4 mr-1" /> Received: {new Date(offer.requestedAt).toLocaleString()} <br />
                      <Info className="inline h-4 w-4 mr-1" /> Task: {offer.taskDetails.substring(0,50)}...
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p><strong className="font-medium">Location:</strong> {offer.clientAddress}</p>
                    {offer.budget && <p><strong className="font-medium">Proposed Budget:</strong> Rs. {offer.budget.toFixed(2)}</p>}
                    {offer.preferredDate && <p><strong className="font-medium">Preferred Date:</strong> {new Date(offer.preferredDate).toLocaleDateString()}</p>}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 border-t pt-3 mt-2">
                        <Button variant="default" onClick={() => handleProviderAcceptOffer(offer)}>
                           <ThumbsUp className="mr-2 h-4 w-4" /> Accept Offer
                        </Button>
                        <Button variant="destructive" onClick={() => handleProviderOpenDeclineDialog(offer)}>
                           <ThumbsDown className="mr-2 h-4 w-4" /> Decline Offer
                        </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
             <Alert className="border-dashed">
              <Briefcase className="h-4 w-4"/>
              <AlertTitle>No New Offers</AlertTitle>
              <AlertDescription>No new offers assigned to you at the moment.</AlertDescription>
            </Alert>
          )}
        </section>
        
        <Separator className="my-8"/>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground/90 flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary"/>Active & Ongoing Offers</h2>
           {providerActiveOffers.length > 0 ? (
            <div className="space-y-4">
              {providerActiveOffers.map((offer) => (
                <Card key={offer.id} className="shadow-md border">
                  <CardHeader className="pb-3">
                     <CardTitle className="text-lg text-primary flex justify-between items-center">
                      <span>Offer for: {offer.taskDetails.substring(0, 50)}... (Client: {offer.clientName})</span>
                       <Badge variant={getStatusBadgeVariant(offer.status)} className="capitalize text-xs px-2 py-0.5">
                        {offer.status.replace(/_/g, ' ')}
                       </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                     <p><strong className="font-medium">Budget:</strong> Rs. {offer.budget?.toFixed(2)}</p>
                     {offer.commissionAmount && <p><strong className="font-medium">Commission (8%):</strong> Rs. {offer.commissionAmount.toFixed(2)}</p>}

                     {offer.status === "offer_accepted_by_provider_pending_payment" && (
                         <Alert variant="default" className="mt-3 p-3 rounded-md bg-amber-50 border-amber-300">
                            <DollarSign className="h-4 w-4 text-amber-700"/>
                            <AlertTitle className="font-semibold text-amber-800">Action Required</AlertTitle>
                            <AlertDescription className="text-amber-700 text-xs">
                                Please pay the commission of Rs. {offer.commissionAmount?.toFixed(2)} to finalize this offer.
                                <Button size="sm" className="mt-2 w-full" onClick={() => { setOfferToAcceptOrDecline(offer); setShowCommissionPaymentDialog(true);}}>Pay Commission</Button>
                            </AlertDescription>
                       </Alert>
                     )}
                     {offer.status === "payment_submitted_pending_admin_approval" && (
                       <Alert variant="default" className="mt-3 p-3 rounded-md bg-blue-50 border-blue-300">
                         <Hourglass className="h-4 w-4 text-blue-700 animate-pulse"/>
                         <AlertTitle className="font-semibold text-blue-800">Pending Admin Verification</AlertTitle>
                         <AlertDescription className="text-blue-700 text-xs">Admin is verifying your commission payment. You'll be notified upon approval.</AlertDescription>
                       </Alert>
                     )}
                    {offer.status === "admin_rejected_payment" && (
                        <Alert variant="destructive" className="mt-3 p-3 rounded-md">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle className="font-semibold">Admin Payment Rejection</AlertTitle>
                            <AlertDescription className="text-xs">Reason: {offer.adminRejectionReason || "Not specified."}
                                <Button size="sm" variant="secondary" className="mt-2 w-full" onClick={() => handleProviderResubmitPayment(offer)}>Resubmit Payment Info</Button>
                            </AlertDescription>
                        </Alert>
                    )}
                    {offer.status === "admin_approved_contact_unlocked" && (
                       <Alert variant="default" className="mt-3 p-3 rounded-md bg-green-50 border-green-300">
                          <CheckCircle className="h-4 w-4 text-green-600"/>
                          <AlertTitle className="font-semibold text-green-700">Offer Approved! Seeker Contact Unlocked</AlertTitle>
                          <AlertDescription className="text-green-600 text-xs space-y-0.5">
                            <p><strong>Name:</strong> {offer.clientName}</p>
                            <p><strong>Phone:</strong> {offer.clientPhone}</p>
                            <p><strong>Email:</strong> {offer.clientEmail || 'N/A'}</p>
                            <p><strong>Address:</strong> {offer.clientAddress}</p>
                            <p><strong>Task:</strong> {offer.taskDetails}</p>
                          </AlertDescription>
                       </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert className="border-dashed">
              <ListChecks className="h-4 w-4"/>
              <AlertTitle>No Active Offers</AlertTitle>
              <AlertDescription>No offers are currently in progress.</AlertDescription>
            </Alert>
          )}
        </section>

        <Separator className="my-8"/>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground/90 flex items-center"><FileText className="mr-2 h-5 w-5 text-primary"/>Work & Offer History</h2>
          {providerWorkHistory.length > 0 ? (
            <div className="space-y-4">
              {providerWorkHistory.map((offer) => (
                <Card key={offer.id} className="bg-card/70 border shadow-sm">
                  <CardHeader className="pb-2">
                     <CardTitle className="text-md flex justify-between items-center">
                       <span>Task: {offer.taskDetails.substring(0, 40)}... (Client: {offer.clientName})</span>
                       <Badge variant={getStatusBadgeVariant(offer.status)} className="capitalize text-xs px-2 py-0.5">
                         {offer.status.replace(/_/g, ' ')}
                       </Badge>
                     </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1">
                      Offered: {new Date(offer.requestedAt).toLocaleDateString()} | Budget: Rs. {offer.budget?.toFixed(2)}
                    </CardDescription>
                  </CardHeader>
                   {offer.status === "offer_declined_by_provider" && offer.providerRejectionReason && (
                     <CardContent className="text-sm py-2">
                       <p className="text-destructive-foreground/80">Your Reason for Decline: {offer.providerRejectionReason}</p>
                     </CardContent>
                   )}
                   <CardFooter className="flex justify-end border-t pt-3 mt-2">
                      <Button variant="ghost" size="sm">
                         <Eye className="mr-2 h-4 w-4" /> View Details
                      </Button>
                   </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Alert className="border-dashed">
              <FileText className="h-4 w-4"/>
              <AlertTitle>No Work History</AlertTitle>
              <AlertDescription>No completed or declined offers in your history yet.</AlertDescription>
            </Alert>
          )}
        </section>
        
        {/* Dialog for Provider to Decline Offer */}
        <Dialog open={!!offerToDecline} onOpenChange={(isOpen) => { if (!isOpen) setOfferToDecline(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">Decline Offer</DialogTitle>
              <DialogDescription>
                You are about to decline the offer from {offerToDecline?.clientName} for "{offerToDecline?.taskDetails.substring(0,50)}...".
                You can optionally provide a reason.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Label htmlFor="providerDeclineReason" className="font-semibold">Reason for Decline (Optional)</Label>
              <Textarea
                id="providerDeclineReason"
                value={providerDeclineReason}
                onChange={(e) => setProviderDeclineReason(e.target.value)}
                placeholder="e.g., Not available, budget too low, outside service area."
                className="min-h-[100px]"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button variant="destructive" onClick={handleProviderSubmitDecline}>Submit Decline</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog for Provider Commission Payment */}
        <Dialog open={showCommissionPaymentDialog} onOpenChange={(isOpen) => { if(!isOpen) setOfferToAcceptOrDecline(null); setShowCommissionPaymentDialog(isOpen);}}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl">Pay Commission Fee</DialogTitle>
                    <DialogDescription>
                        To finalize acceptance of the offer for "{offerToAcceptOrDecline?.taskDetails.substring(0,100)}..." (Budget: Rs. {offerToAcceptOrDecline?.budget?.toFixed(2)}), 
                        please pay the 8% commission fee of <span className="font-bold text-primary">Rs. {offerToAcceptOrDecline?.commissionAmount?.toFixed(2)}</span> using the eSewa QR code below.
                        Offer ID: {offerToAcceptOrDecline?.id.substring(0,8)}...
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 flex flex-col items-center space-y-3">
                     <Image
                        src="/esewa_admin_qr.png" 
                        alt="eSewa Admin QR Code"
                        width={200}
                        height={200}
                        className="rounded-md border shadow-sm"
                        data-ai-hint="QR payment"
                     />
                     <p className="text-sm text-muted-foreground">Scan with your eSewa app. Use Offer ID as reference if possible.</p>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleProviderPaidCommission}>I Have Paid Commission Fee</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      </div>
    );
  }

  // SEEKER DASHBOARD
  if (role === 'seeker') {
    return (
       <div className="space-y-8 p-4 md:p-6">
        <Card className="shadow-lg border-primary/30">
          <CardHeader className="bg-primary/5 rounded-t-lg">
            <CardTitle className="flex items-center text-2xl md:text-3xl text-primary">
              <MessageSquare className="mr-3 h-7 w-7" />
              Seeker Dashboard
            </CardTitle>
            <CardDescription className="text-md text-muted-foreground">
              Manage your offers and find service providers.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Button className="w-full md:w-auto mb-6" onClick={() => router.push('/providers')}>
                <SendHorizonal className="mr-2 h-4 w-4" /> Send New Offer / Find Provider
            </Button>
          </CardContent>
        </Card>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground/90 flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary"/>My Sent Offers (Active)</h2>
          {seekerSentOffers.length > 0 ? (
             <div className="space-y-4">
              {seekerSentOffers.map((offer) => (
                <Card key={offer.id} className="shadow-md border">
                  <CardHeader className="pb-3">
                     <CardTitle className="text-lg text-primary flex justify-between items-center">
                      <span>Offer to: {getProviderName(offer.providerId, localServiceProviders)}</span>
                       <Badge variant={getStatusBadgeVariant(offer.status)} className="capitalize text-xs px-2 py-0.5">
                        {offer.status.replace(/_/g, ' ')}
                       </Badge>
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground mt-1">
                      <Clock className="inline h-4 w-4 mr-1" /> Sent: {new Date(offer.requestedAt).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                     <p><strong className="font-medium">Task:</strong> {offer.taskDetails}</p>
                     {offer.budget && <p><strong className="font-medium">Your Budget:</strong> Rs. {offer.budget.toFixed(2)}</p>}
                     {offer.preferredDate && <p><strong className="font-medium">Preferred Date:</strong> {new Date(offer.preferredDate).toLocaleDateString()}</p>}
                     
                     {offer.status === "offer_declined_by_provider" && offer.providerRejectionReason && (
                       <Alert variant="destructive" className="mt-2">
                         <AlertTriangle className="h-4 w-4"/>
                         <AlertTitle>Offer Declined by Provider</AlertTitle>
                         <AlertDescription>Reason: {offer.providerRejectionReason}</AlertDescription>
                       </Alert>
                     )}
                     {offer.status === "admin_approved_contact_unlocked" && (
                        <Alert variant="default" className="mt-3 p-3 rounded-md bg-green-50 border-green-300">
                          <CheckCircle className="h-4 w-4 text-green-600"/>
                          <AlertTitle className="font-semibold text-green-700">Offer Approved! Contact Provider</AlertTitle>
                           <AlertDescription className="text-green-600 text-xs space-y-0.5">
                                Please contact {getProviderName(offer.providerId, localServiceProviders)} using the details on their profile page to coordinate the service.
                                <Button size="sm" className="mt-2" asChild>
                                    <Link href={`/providers/${offer.providerId}`}>View Provider Profile</Link>
                                </Button>
                           </AlertDescription>
                        </Alert>
                     )}
                     {offer.status === "admin_rejected_payment" && (
                         <Alert variant="warning" className="mt-2">
                           <AlertTriangle className="h-4 w-4"/>
                           <AlertTitle>Provider Payment Issue</AlertTitle>
                           <AlertDescription>There was an issue with the provider's commission payment ({offer.adminRejectionReason}). The provider has been notified. Please wait for them to resolve it or contact them if the offer was urgent.</AlertDescription>
                         </Alert>
                     )}
                  </CardContent>
                   <CardFooter className="flex justify-end border-t pt-3 mt-2">
                      {/* Add cancel offer button here if status allows */}
                   </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Alert className="border-dashed">
              <ListChecks className="h-4 w-4"/>
              <AlertTitle>No Active Offers</AlertTitle>
              <AlertDescription>You haven't sent any offers that are currently active. <Link href="/providers" className="underline text-primary">Find a provider</Link> to send one.</AlertDescription>
            </Alert>
          )}
        </section>

        <Separator className="my-8"/>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground/90 flex items-center"><History className="mr-2 h-5 w-5 text-primary"/>Offer History</h2>
           {seekerOfferHistory.length > 0 ? (
             <div className="space-y-4">
              {seekerOfferHistory.map((offer) => (
                 <Card key={offer.id} className="bg-card/70 border shadow-sm">
                  <CardHeader className="pb-2">
                     <CardTitle className="text-md flex justify-between items-center">
                       <span>Offer for: {offer.taskDetails.substring(0, 40)}... (To: {getProviderName(offer.providerId, localServiceProviders)})</span>
                       <Badge variant={getStatusBadgeVariant(offer.status)} className="capitalize text-xs px-2 py-0.5">
                         {offer.status.replace(/_/g, ' ')}
                       </Badge>
                     </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1">
                      Sent: {new Date(offer.requestedAt).toLocaleDateString()} | Budget: Rs. {offer.budget?.toFixed(2)}
                    </CardDescription>
                  </CardHeader>
                 </Card>
              ))}
            </div>
           ) : (
             <Alert className="border-dashed">
                <History className="h-4 w-4"/>
                <AlertTitle>No Offer History</AlertTitle>
                <AlertDescription>No completed or declined offers in your history yet.</AlertDescription>
            </Alert>
           )}
        </section>
      </div>
    );
  }

  // Default Fallback (e.g. if role is null or unexpected)
  return (
    <div className="space-y-8 p-4 md:p-6">
      <Card className="shadow-lg border-primary/30">
        <CardHeader className="bg-primary/5 rounded-t-lg">
          <CardTitle className="flex items-center text-2xl md:text-3xl text-primary">
            <MessageSquare className="mr-3 h-7 w-7" />
            User Dashboard
          </CardTitle>
          <CardDescription className="text-md text-muted-foreground">
            Welcome to your SewaSathi dashboard. Your role specific dashboard is loading or not yet configured.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mt-6 p-8 border-2 border-dashed border-muted-foreground/30 rounded-lg text-center bg-muted/20">
            <Settings className="mx-auto h-12 w-12 text-muted-foreground/70 mb-4 animate-spin_slow" />
            <p className="text-xl font-semibold text-muted-foreground">Loading or Role not Set</p>
            <p className="text-sm text-muted-foreground mt-1">If this persists, please contact support or try re-logging.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
