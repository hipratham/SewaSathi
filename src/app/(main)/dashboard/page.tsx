
"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { mockServiceRequests, mockServiceProviders } from "@/lib/mock-data"; 
import type { ServiceRequest, ServiceRequestStatus, ServiceProvider, ServiceProviderAvailability, ServiceProviderRates } from "@/lib/types";
import { AlertCircle, CheckCircle, Clock, DollarSign, Eye, MessageSquare, XCircle, Info, LayoutDashboard, Hourglass, UserCog, UserCheck, Briefcase, FileText, Users, ListChecks, User as UserIcon, Settings, Banknote, CalendarDays } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Helper function to find provider name from mock data
const getProviderName = (providerId: string | null | undefined, providers: ServiceProvider[]): string => {
  if (!providerId) return "N/A";
  const provider = providers.find(p => p.id === providerId);
  return provider ? provider.name : "Unknown Provider";
};

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


export default function DashboardPage() {
  const { user, role, loading } = useAuth();
  const { toast } = useToast();
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>(mockServiceRequests);
  const [selectedRequestForAccept, setSelectedRequestForAccept] = useState<ServiceRequest | null>(null);
  const [estimatedCharge, setEstimatedCharge] = useState<number | string>("");
  const [showAdminFeeDialog, setShowAdminFeeDialog] = useState(false);
  const [currentAdminFee, setCurrentAdminFee] = useState(0);
  const [adminRejectionReasonInput, setAdminRejectionReasonInput] = useState("");
  const [requestToReject, setRequestToReject] = useState<ServiceRequest | null>(null);


  const updateRequestStatusLocally = (requestId: string, newStatus: ServiceRequestStatus, updates?: Partial<ServiceRequest>) => {
    setServiceRequests(prevRequests =>
      prevRequests.map(req =>
        req.id === requestId ? { ...req, status: newStatus, ...updates } : req
      )
    );
    // TODO: Implement actual Firebase update here
    // const requestRef = ref(database, `serviceRequests/${requestId}`);
    // update(requestRef, { status: newStatus, ...updates }).catch(error => {
    //   toast({ variant: "destructive", title: "Database Error", description: "Failed to update request status in DB."});
    //   console.error("DB update error: ", error);
    // });
  };

  const handleOpenAcceptDialog = (request: ServiceRequest) => {
    setSelectedRequestForAccept(request);
    setEstimatedCharge(""); 
  };

  const handleEstimateSubmit = () => {
    if (!selectedRequestForAccept || !estimatedCharge || +estimatedCharge <= 0) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Please enter a valid estimated charge." });
      return;
    }
    const fee = +estimatedCharge * 0.08;
    setCurrentAdminFee(fee);
    updateRequestStatusLocally(selectedRequestForAccept.id, "pending_admin_fee", {
      estimatedJobValueByProvider: +estimatedCharge,
      adminFeeCalculated: fee,
    });
    setShowAdminFeeDialog(true);
  };

  const handleAdminFeePaid = () => {
    if (!selectedRequestForAccept) return;
    updateRequestStatusLocally(selectedRequestForAccept.id, "awaiting_admin_confirmation", { adminFeePaid: true });
    setShowAdminFeeDialog(false);
    setSelectedRequestForAccept(null); 
    toast({ title: "Payment Submitted", description: "Admin fee payment noted. Waiting for admin confirmation." });
  };
  
  const handleAdminApprovePayment = (requestId: string) => {
    updateRequestStatusLocally(requestId, "accepted_by_provider");
    toast({ title: "Payment Approved!", description: "Request is now active. Client details shared with provider."});
  };

  const handleAdminOpenRejectDialog = (request: ServiceRequest) => {
    setRequestToReject(request);
    setAdminRejectionReasonInput("");
  };

  const handleAdminSubmitRejection = () => {
    if (!requestToReject || !adminRejectionReasonInput.trim()) {
      toast({ variant: "destructive", title: "Reason Required", description: "Please provide a reason for rejection."});
      return;
    }
    updateRequestStatusLocally(requestToReject.id, "admin_fee_payment_rejected", { adminRejectionReason: adminRejectionReasonInput.trim() });
    toast({ title: "Payment Rejected", description: "Provider has been notified."});
    setRequestToReject(null);
  };


  const handleRejectOffer = (requestId: string) => {
    updateRequestStatusLocally(requestId, "rejected_by_provider");
    toast({ title: "Offer Rejected", description: "The service request has been marked as rejected." });
  };


  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Hourglass className="h-12 w-12 animate-spin text-primary" /> <p className="ml-4 text-lg text-muted-foreground">Loading dashboard...</p></div>;
  }

  // ADMIN DASHBOARD
  if (role === 'admin') {
    const pendingAdminConfirmations = serviceRequests.filter(req => req.status === "awaiting_admin_confirmation");

    return (
      <div className="space-y-8 p-4 md:p-6">
        <Card className="shadow-lg border-primary/30">
          <CardHeader className="bg-primary/5 rounded-t-lg">
            <CardTitle className="flex items-center text-2xl md:text-3xl text-primary">
              <UserCog className="mr-3 h-7 w-7" />
              Admin Dashboard
            </CardTitle>
            <CardDescription className="text-md text-muted-foreground">
              Manage platform activities, service requests, and provider payments.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 md:p-6">
            <Tabs defaultValue="pending-confirmations" className="w-full">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-1 p-1 bg-muted rounded-lg mb-6">
                <TabsTrigger value="pending-confirmations" className="text-sm py-2.5">
                  <Banknote className="mr-2 h-4 w-4"/>Pending Confirmations <Badge variant="destructive" className="ml-2">{pendingAdminConfirmations.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="all-requests" className="text-sm py-2.5">
                  <ListChecks className="mr-2 h-4 w-4"/>All Service Requests
                </TabsTrigger>
                <TabsTrigger value="providers" className="text-sm py-2.5">
                  <Users className="mr-2 h-4 w-4"/>Service Providers
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending-confirmations" className="mt-0">
                <Card className="border-accent/30 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl text-accent">Admin Fee Payment Confirmations</CardTitle>
                    <CardDescription>Review and confirm provider admin fee payments.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {pendingAdminConfirmations.length > 0 ? (
                      pendingAdminConfirmations.map((req) => (
                        <Card key={req.id} className="shadow-md border hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg text-primary-foreground bg-primary/90 px-4 py-2 rounded-t-md flex justify-between items-center">
                              <span>Request ID: {req.id.substring(0, 8)}...</span>
                               <Badge variant="secondary" className="capitalize bg-background text-primary font-semibold">
                                {req.status.replace(/_/g, ' ')}
                               </Badge>
                            </CardTitle>
                            <CardDescription className="pt-3 px-4 text-sm">
                              Provider: {getProviderName(req.providerId, mockServiceProviders)}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="text-sm space-y-2 px-4">
                            <p><strong className="font-medium">Client Need:</strong> {req.clientServiceNeeded.substring(0, 100)}...</p>
                            <p><strong className="font-medium">Provider Estimate:</strong> Rs. {req.estimatedJobValueByProvider?.toFixed(2)}</p>
                            <p><strong className="font-medium">Admin Fee (8%):</strong> Rs. {req.adminFeeCalculated?.toFixed(2)}</p>
                          </CardContent>
                          <CardFooter className="flex justify-end gap-2 px-4 py-3 border-t mt-2">
                            <Button variant="default" size="sm" onClick={() => handleAdminApprovePayment(req.id)}>
                              <CheckCircle className="mr-2 h-4 w-4" /> Approve
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleAdminOpenRejectDialog(req)}>
                              <XCircle className="mr-2 h-4 w-4" /> Reject
                            </Button>
                          </CardFooter>
                        </Card>
                      ))
                    ) : (
                      <Alert className="border-dashed">
                        <AlertCircle className="h-4 w-4"/>
                        <AlertTitle>All Clear!</AlertTitle>
                        <AlertDescription>No pending payment confirmations.</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="all-requests" className="mt-0">
                <Card className="border-secondary/30 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl text-secondary-foreground flex items-center">
                        <ListChecks className="mr-2 h-5 w-5 text-secondary"/> All Service Requests
                    </CardTitle>
                    <CardDescription>Overview of all service requests on the platform.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {serviceRequests.length > 0 ? (
                      serviceRequests.map((req) => (
                        <Card key={req.id} className="shadow-sm border hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-md flex justify-between items-center">
                              <span>Client: {req.clientName} (Req ID: {req.id.substring(0,8)}...)</span>
                              <Badge variant={
                                req.status === "pending_provider_action" || req.status === "awaiting_admin_confirmation" || req.status === "pending_admin_fee" ? "secondary" :
                                req.status === "accepted_by_provider" ? "default" :
                                req.status === "rejected_by_provider" || req.status === "admin_fee_payment_rejected" ? "destructive" :
                                req.status === "job_completed" || req.status === "request_completed" ? "outline" : "default"
                              } className="capitalize text-xs px-2 py-0.5">
                                {req.status.replace(/_/g, ' ')}
                              </Badge>
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              <CalendarDays className="inline h-3.5 w-3.5 mr-1"/> Requested: {new Date(req.requestedAt).toLocaleString()}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="text-sm space-y-1.5">
                            <p><strong className="font-medium">Service Needed:</strong> {req.clientServiceNeeded}</p>
                            <p><strong className="font-medium">Client Contact:</strong> {req.clientPhone} | <strong className="font-medium">Address:</strong> {req.clientAddress}</p>
                            <Separator className="my-2.5"/>
                            <p><strong className="font-medium">Assigned Provider:</strong> {getProviderName(req.providerId, mockServiceProviders)}</p>
                            {req.estimatedJobValueByProvider != null && <p><strong className="font-medium">Provider Estimate:</strong> Rs. {req.estimatedJobValueByProvider.toFixed(2)}</p>}
                            {req.adminFeeCalculated != null && <p><strong className="font-medium">Admin Fee:</strong> Rs. {req.adminFeeCalculated.toFixed(2)} (Paid: {req.adminFeePaid ? <CheckCircle className="inline h-4 w-4 text-green-600" /> : <XCircle className="inline h-4 w-4 text-red-600" />})</p>}
                            {req.status === 'admin_fee_payment_rejected' && req.adminRejectionReason && (
                              <Alert variant="destructive" className="mt-2 text-xs p-3 rounded-md">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle className="text-sm font-semibold">Payment Rejected by Admin</AlertTitle>
                                <AlertDescription>Reason: {req.adminRejectionReason}</AlertDescription>
                              </Alert>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                       <Alert className="border-dashed">
                        <ListChecks className="h-4 w-4"/>
                        <AlertTitle>No Requests Yet</AlertTitle>
                        <AlertDescription>No service requests found on the platform.</AlertDescription>
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
                    {mockServiceProviders.length > 0 ? (
                      mockServiceProviders.map((provider) => (
                        <Card key={provider.id} className="shadow-sm border hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center text-primary">
                              <UserIcon className="mr-2 h-5 w-5" /> {provider.name}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              Category: {provider.category}{provider.category === 'other' && provider.otherCategoryDescription ? ` (${provider.otherCategoryDescription})` : ''} | ID: {provider.id.substring(0,15)}...
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="text-sm space-y-1.5">
                            <p><strong className="font-medium">Contact:</strong> {provider.contactInfo.phone} / {provider.contactInfo.email}</p>
                            <p><strong className="font-medium">Address:</strong> {provider.address}</p>
                            {provider.servicesOffered && provider.servicesOffered.length > 0 && (
                              <p><strong className="font-medium">Services:</strong> {provider.servicesOffered.join(", ")}</p>
                            )}
                             <p><strong className="font-medium">Availability:</strong> {formatAvailabilityForAdmin(provider.availability)}</p>
                            <div><strong className="font-medium">Rates:</strong> {formatRatesForAdmin(provider.rates)}</div>
                            <p><strong className="font-medium">Rating:</strong> {provider.overallRating.toFixed(1)} ({provider.reviews.length} reviews)</p>
                          </CardContent>
                          <CardFooter className="border-t mt-2 py-3">
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

        {/* Dialog for Admin to reject payment */}
        <Dialog open={!!requestToReject} onOpenChange={(isOpen) => { if (!isOpen) setRequestToReject(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">Reject Admin Fee Payment</DialogTitle>
              <DialogDescription>
                Provide a reason for rejecting the payment for request ID: {requestToReject?.id.substring(0,8)}...
                (Provider: {getProviderName(requestToReject?.providerId, mockServiceProviders)})
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Label htmlFor="rejectionReason" className="font-semibold">Rejection Reason</Label>
              <Textarea
                id="rejectionReason"
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
    const recentRequests = serviceRequests.filter(
      req => req.providerId === user?.uid && (req.status === "pending_provider_action" || req.status === "pending_admin_fee" || req.status === "awaiting_admin_confirmation" || req.status === "admin_fee_payment_rejected")
    ).slice(0, 5); 

    const workHistory = serviceRequests.filter(
      req => req.providerId === user?.uid && (req.status === "job_completed" || req.status === "request_completed" ||  req.status === "rejected_by_provider")
    ).slice(0, 5); 

    return (
      <div className="space-y-8 p-4 md:p-6">
        <Card className="shadow-lg border-primary/30">
          <CardHeader className="bg-primary/5 rounded-t-lg">
            <CardTitle className="flex items-center text-2xl md:text-3xl text-primary">
              <LayoutDashboard className="mr-3 h-7 w-7" />
              Provider Dashboard
            </CardTitle>
            <CardDescription className="text-md text-muted-foreground">Manage your service requests and profile.</CardDescription>
          </CardHeader>
        </Card>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground/90 flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary"/>Recent Service Requests</h2>
          {recentRequests.length > 0 ? (
            <div className="space-y-4">
              {recentRequests.map((req) => (
                <Card key={req.id} className="shadow-md hover:shadow-lg transition-shadow border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-primary flex justify-between items-center">
                      <span>Request: {req.clientServiceNeeded.substring(0, 50)}...</span>
                       <Badge variant={
                        req.status === "pending_provider_action" ? "default" :
                        req.status === "pending_admin_fee" ? "secondary" :
                        req.status === "awaiting_admin_confirmation" ? "outline" : 
                        req.status === "admin_fee_payment_rejected" ? "destructive" : "default"
                       } className="capitalize text-xs px-2 py-0.5">
                        {req.status.replace(/_/g, ' ')}
                       </Badge>
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground mt-1">
                      <Clock className="inline h-4 w-4 mr-1" /> Requested: {new Date(req.requestedAt).toLocaleString()} <br />
                      <Info className="inline h-4 w-4 mr-1" /> Category: {req.serviceCategory || "N/A"} <br/>
                      Client Name (Initial): {req.clientName.split(' ')[0]}...
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p className="mb-1"><strong className="font-medium">Location:</strong> {req.clientAddress}</p>
                    <p><strong className="font-medium">Needs:</strong> {req.clientServiceNeeded}</p>
                    
                    {req.status === "admin_fee_payment_rejected" && req.adminRejectionReason && (
                        <Alert variant="destructive" className="mt-3 p-3 rounded-md">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle className="font-semibold">Admin Fee Rejection</AlertTitle>
                            <AlertDescription className="text-xs">Reason: {req.adminRejectionReason}. Please contact admin or try payment again if applicable.</AlertDescription>
                        </Alert>
                    )}
                    {req.status === "accepted_by_provider" && (
                       <Alert variant="default" className="mt-3 p-3 rounded-md bg-green-50 border-green-300">
                          <CheckCircle className="h-4 w-4 text-green-600"/>
                          <AlertTitle className="font-semibold text-green-700">Client Contact Details Unlocked</AlertTitle>
                          <AlertDescription className="text-green-600 text-xs">
                            Name: {req.clientName} <br/>
                            Phone: {req.clientPhone} <br/>
                            Address: {req.clientAddress}
                          </AlertDescription>
                       </Alert>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 border-t pt-3 mt-2">
                    {req.status === "pending_provider_action" && (
                      <>
                        <DialogTrigger asChild>
                          <Button variant="default" onClick={() => handleOpenAcceptDialog(req)}>
                            <CheckCircle className="mr-2 h-4 w-4" /> Accept Offer
                          </Button>
                        </DialogTrigger>
                        <Button variant="destructive" onClick={() => handleRejectOffer(req.id)}>
                           <XCircle className="mr-2 h-4 w-4" /> Reject Offer
                        </Button>
                      </>
                    )}
                    {(req.status === "pending_admin_fee" || req.status === "admin_fee_payment_rejected") && (
                      <Button variant="secondary" onClick={() => {
                        setSelectedRequestForAccept(req);
                        setCurrentAdminFee(req.adminFeeCalculated || 0);
                        setShowAdminFeeDialog(true);
                      }}>
                        <DollarSign className="mr-2 h-4 w-4" /> Pay Admin Fee (Rs. {req.adminFeeCalculated?.toFixed(2)})
                      </Button>
                    )}
                    {req.status === "awaiting_admin_confirmation" && (
                       <div className="text-sm text-muted-foreground flex items-center p-2 bg-amber-50 border border-amber-200 rounded-md">
                         <Hourglass className="mr-2 h-4 w-4 animate-pulse text-amber-600" /> Waiting for admin to confirm fee payment...
                       </div>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
             <Alert className="border-dashed">
              <Briefcase className="h-4 w-4"/>
              <AlertTitle>No New Requests</AlertTitle>
              <AlertDescription>No new service requests assigned to you at the moment.</AlertDescription>
            </Alert>
          )}
        </section>

        <Separator className="my-8"/>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground/90 flex items-center"><FileText className="mr-2 h-5 w-5 text-primary"/>Work History</h2>
          {workHistory.length > 0 ? (
            <div className="space-y-4">
              {workHistory.map((req) => (
                <Card key={req.id} className="bg-card/70 border shadow-sm">
                  <CardHeader className="pb-2">
                     <CardTitle className="text-md flex justify-between items-center">
                       <span>{req.clientServiceNeeded.substring(0, 50)}...</span>
                       <Badge variant={req.status === "rejected_by_provider" ? "destructive" : "secondary"} className="capitalize text-xs px-2 py-0.5">
                         {req.status.replace(/_/g, ' ')}
                       </Badge>
                     </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1">
                      Client: {req.clientName} | Completed: {new Date(req.requestedAt).toLocaleDateString()} 
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm py-2">
                    <p>Details: {req.clientServiceNeeded}</p>
                    {req.estimatedJobValueByProvider && <p>Value: Rs. {req.estimatedJobValueByProvider.toFixed(2)}</p>}
                  </CardContent>
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
              <AlertDescription>No completed or rejected jobs in your history yet.</AlertDescription>
            </Alert>
          )}
        </section>

        <Dialog open={!!selectedRequestForAccept && !showAdminFeeDialog} onOpenChange={(isOpen) => {
            if (!isOpen) setSelectedRequestForAccept(null);
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">Accept Service Request</DialogTitle>
              <DialogDescription>
                Enter your estimated charge for the service: "{selectedRequestForAccept?.clientServiceNeeded.substring(0,100)}..."
                This will be shown to the client. An 8% admin fee will be calculated based on this amount.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="estimatedCharge" className="text-right col-span-1 font-semibold">
                  Charge (Rs.)
                </Label>
                <Input
                  id="estimatedCharge"
                  type="number"
                  value={estimatedCharge}
                  onChange={(e) => setEstimatedCharge(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., 1500"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleEstimateSubmit}>Submit Estimate & Proceed</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAdminFeeDialog} onOpenChange={setShowAdminFeeDialog}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl">Pay Admin Fee</DialogTitle>
                    <DialogDescription>
                        To finalize acceptance of the request for "{selectedRequestForAccept?.clientServiceNeeded.substring(0,100)}...", 
                        please pay the 8% admin fee of <span className="font-bold text-primary">Rs. {currentAdminFee.toFixed(2)}</span> using the eSewa QR code below.
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
                     <p className="text-sm text-muted-foreground">Scan with your eSewa app.</p>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleAdminFeePaid}>I Have Paid Admin Fee</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      </div>
    );
  }

  // SEEKER DASHBOARD (or default if role is null/unknown)
  return (
    <div className="space-y-8 p-4 md:p-6">
      <Card className="shadow-lg border-primary/30">
        <CardHeader className="bg-primary/5 rounded-t-lg">
          <CardTitle className="flex items-center text-2xl md:text-3xl text-primary">
            <MessageSquare className="mr-3 h-7 w-7" />
            User Dashboard
          </CardTitle>
          <CardDescription className="text-md text-muted-foreground">
            Welcome to your SewaSathi dashboard. This area is under construction for service seekers.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Here you will be able to manage your service requests, view your history, and update your profile.
          </p>
          <div className="mt-6 p-8 border-2 border-dashed border-muted-foreground/30 rounded-lg text-center bg-muted/20">
            <Settings className="mx-auto h-12 w-12 text-muted-foreground/70 mb-4 animate-spin_slow" />
            <p className="text-xl font-semibold text-muted-foreground">Coming Soon!</p>
            <p className="text-sm text-muted-foreground mt-1">Exciting features are on their way for service seekers.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Add a custom animation for slow spin to globals.css or tailwind.config.js if needed
// For example in tailwind.config.js:
// animation: {
//   'spin_slow': 'spin 3s linear infinite',
// }
