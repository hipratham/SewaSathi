
"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { mockServiceRequests, mockServiceProviders } from "@/lib/mock-data"; 
import type { ServiceRequest, ServiceRequestStatus, ServiceProvider, ServiceProviderAvailability, ServiceProviderRates } from "@/lib/types";
import { AlertCircle, CheckCircle, Clock, DollarSign, Eye, MessageSquare, XCircle, Info, LayoutDashboard, Hourglass, UserCog, UserCheck, Briefcase, FileText, Users, ListChecks, User as UserIcon } from "lucide-react";
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
    return <div className="flex justify-center items-center h-64"><Hourglass className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Loading dashboard...</p></div>;
  }

  // ADMIN DASHBOARD
  if (role === 'admin') {
    const pendingAdminConfirmations = serviceRequests.filter(req => req.status === "awaiting_admin_confirmation");

    return (
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-primary">
              <UserCog className="mr-2 h-6 w-6" />
              Admin Dashboard
            </CardTitle>
            <CardDescription>
              Manage platform activities, service requests, and provider payments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending-confirmations" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending-confirmations">Pending Confirmations</TabsTrigger>
                <TabsTrigger value="all-requests">All Service Requests</TabsTrigger>
                <TabsTrigger value="providers">Service Providers</TabsTrigger>
              </TabsList>

              <TabsContent value="pending-confirmations" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Admin Fee Payment Confirmations</CardTitle>
                    <CardDescription>Review and confirm provider admin fee payments.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {pendingAdminConfirmations.length > 0 ? (
                      pendingAdminConfirmations.map((req) => (
                        <Card key={req.id} className="shadow-md">
                          <CardHeader>
                            <CardTitle className="text-lg">Request ID: {req.id.substring(0, 8)}...</CardTitle>
                            <CardDescription>
                              Provider: {getProviderName(req.providerId, mockServiceProviders)}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="text-sm space-y-1">
                            <p><span className="font-semibold">Client Need:</span> {req.clientServiceNeeded.substring(0, 100)}...</p>
                            <p><span className="font-semibold">Provider Estimate:</span> Rs. {req.estimatedJobValueByProvider?.toFixed(2)}</p>
                            <p><span className="font-semibold">Admin Fee (8%):</span> Rs. {req.adminFeeCalculated?.toFixed(2)}</p>
                            <p><span className="font-semibold">Status:</span> <Badge variant="secondary" className="capitalize">{req.status.replace(/_/g, ' ')}</Badge></p>
                          </CardContent>
                          <CardFooter className="flex justify-end gap-2">
                            <Button variant="default" size="sm" onClick={() => handleAdminApprovePayment(req.id)}>
                              <CheckCircle className="mr-2 h-4 w-4" /> Approve Payment
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleAdminOpenRejectDialog(req)}>
                              <XCircle className="mr-2 h-4 w-4" /> Reject Payment
                            </Button>
                          </CardFooter>
                        </Card>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No pending payment confirmations.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="all-requests" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                        <ListChecks className="mr-2 h-5 w-5 text-primary"/> All Service Requests
                    </CardTitle>
                    <CardDescription>Overview of all service requests on the platform.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {serviceRequests.length > 0 ? (
                      serviceRequests.map((req) => (
                        <Card key={req.id} className="shadow-sm border">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-md flex justify-between items-center">
                              <span>Client: {req.clientName}</span>
                              <Badge variant={
                                req.status === "pending_provider_action" || req.status === "awaiting_admin_confirmation" || req.status === "pending_admin_fee" ? "secondary" :
                                req.status === "accepted_by_provider" ? "default" :
                                req.status === "rejected_by_provider" || req.status === "admin_fee_payment_rejected" ? "destructive" :
                                req.status === "job_completed" || req.status === "request_completed" ? "outline" : "default"
                              } className="capitalize text-xs">
                                {req.status.replace(/_/g, ' ')}
                              </Badge>
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Requested: {new Date(req.requestedAt).toLocaleString()} | Request ID: {req.id.substring(0,8)}...
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="text-sm space-y-1">
                            <p><strong className="font-medium">Service Needed:</strong> {req.clientServiceNeeded}</p>
                            <p><strong className="font-medium">Client Contact:</strong> {req.clientPhone} | <strong className="font-medium">Address:</strong> {req.clientAddress}</p>
                            <Separator className="my-2"/>
                            <p><strong className="font-medium">Assigned Provider:</strong> {getProviderName(req.providerId, mockServiceProviders)}</p>
                            {req.estimatedJobValueByProvider != null && <p><strong className="font-medium">Provider Estimate:</strong> Rs. {req.estimatedJobValueByProvider.toFixed(2)}</p>}
                            {req.adminFeeCalculated != null && <p><strong className="font-medium">Admin Fee:</strong> Rs. {req.adminFeeCalculated.toFixed(2)} (Paid: {req.adminFeePaid ? <CheckCircle className="inline h-4 w-4 text-green-600" /> : <XCircle className="inline h-4 w-4 text-red-600" />})</p>}
                            {req.status === 'admin_fee_payment_rejected' && req.adminRejectionReason && (
                              <Alert variant="destructive" className="mt-2 text-xs p-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle className="text-sm">Payment Rejected by Admin</AlertTitle>
                                <AlertDescription>Reason: {req.adminRejectionReason}</AlertDescription>
                              </Alert>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No service requests found.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="providers" className="mt-6">
                <Card>
                  <CardHeader>
                     <CardTitle className="flex items-center">
                        <Users className="mr-2 h-5 w-5 text-primary"/>All Service Providers
                    </CardTitle>
                    <CardDescription>Overview of registered service providers.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mockServiceProviders.length > 0 ? (
                      mockServiceProviders.map((provider) => (
                        <Card key={provider.id} className="shadow-sm border">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center">
                              <UserIcon className="mr-2 h-5 w-5 text-primary" /> {provider.name}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Category: {provider.category}{provider.category === 'other' && provider.otherCategoryDescription ? ` (${provider.otherCategoryDescription})` : ''} | ID: {provider.id.substring(0,15)}...
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="text-sm space-y-1">
                            <p><strong className="font-medium">Contact:</strong> {provider.contactInfo.phone} / {provider.contactInfo.email}</p>
                            <p><strong className="font-medium">Address:</strong> {provider.address}</p>
                            {provider.servicesOffered && provider.servicesOffered.length > 0 && (
                              <p><strong className="font-medium">Services:</strong> {provider.servicesOffered.join(", ")}</p>
                            )}
                             <p><strong className="font-medium">Availability:</strong> {formatAvailabilityForAdmin(provider.availability)}</p>
                            <div><strong className="font-medium">Rates:</strong> {formatRatesForAdmin(provider.rates)}</div>
                            <p><strong className="font-medium">Rating:</strong> {provider.overallRating.toFixed(1)} ({provider.reviews.length} reviews)</p>
                          </CardContent>
                          <CardFooter>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/providers/${provider.id}`}>View Full Public Profile</Link>
                            </Button>
                          </CardFooter>
                        </Card>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No service providers found.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Dialog for Admin to reject payment */}
        <Dialog open={!!requestToReject} onOpenChange={(isOpen) => { if (!isOpen) setRequestToReject(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Admin Fee Payment</DialogTitle>
              <DialogDescription>
                Provide a reason for rejecting the payment for request ID: {requestToReject?.id.substring(0,8)}...
                (Provider: {getProviderName(requestToReject?.providerId, mockServiceProviders)})
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Label htmlFor="rejectionReason">Rejection Reason</Label>
              <Textarea
                id="rejectionReason"
                value={adminRejectionReasonInput}
                onChange={(e) => setAdminRejectionReasonInput(e.target.value)}
                placeholder="e.g., Payment not reflected, screenshot unclear, etc."
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
      req => req.status === "pending_provider_action" || req.status === "pending_admin_fee" || req.status === "awaiting_admin_confirmation" || req.status === "admin_fee_payment_rejected"
    ).slice(0, 5); 

    const workHistory = serviceRequests.filter(
      req => req.status === "job_completed" || req.status === "request_completed" ||  req.status === "rejected_by_provider"
    ).slice(0, 5); 

    return (
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-primary">
              <LayoutDashboard className="mr-2 h-6 w-6" />
              Provider Dashboard
            </CardTitle>
            <CardDescription>Manage your service requests and profile.</CardDescription>
          </CardHeader>
        </Card>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground/90">Recent Service Requests</h2>
          {recentRequests.length > 0 ? (
            <div className="space-y-4">
              {recentRequests.map((req) => (
                <Card key={req.id} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary flex justify-between items-center">
                      <span>Request: {req.clientServiceNeeded.substring(0, 50)}...</span>
                       <Badge variant={
                        req.status === "pending_provider_action" ? "default" :
                        req.status === "pending_admin_fee" ? "secondary" :
                        req.status === "awaiting_admin_confirmation" ? "outline" : 
                        req.status === "admin_fee_payment_rejected" ? "destructive" : "default"
                       } className="capitalize">
                        {req.status.replace(/_/g, ' ')}
                       </Badge>
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      <Clock className="inline h-4 w-4 mr-1" /> Requested: {new Date(req.requestedAt).toLocaleString()} <br />
                      <Info className="inline h-4 w-4 mr-1" /> Category: {req.serviceCategory || "N/A"} <br/>
                      Client Name (Initial): {req.clientName.split(' ')[0]}...
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-1"><span className="font-semibold">Location:</span> {req.clientAddress}</p>
                    <p className="text-sm"><span className="font-semibold">Needs:</span> {req.clientServiceNeeded}</p>
                    
                    {req.status === "admin_fee_payment_rejected" && req.adminRejectionReason && (
                        <Alert variant="destructive" className="mt-3">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Admin Fee Rejection</AlertTitle>
                            <AlertDescription>Reason: {req.adminRejectionReason}. Please contact admin or try payment again if applicable.</AlertDescription>
                        </Alert>
                    )}
                    {req.status === "accepted_by_provider" && (
                       <div className="mt-3 pt-3 border-t">
                          <h4 className="font-semibold text-md text-green-600">Client Contact Details:</h4>
                          <p className="text-sm">Name: {req.clientName}</p>
                          <p className="text-sm">Phone: {req.clientPhone}</p>
                          <p className="text-sm">Address: {req.clientAddress}</p>
                       </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
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
                       <p className="text-sm text-muted-foreground flex items-center">
                         <Hourglass className="mr-2 h-4 w-4 animate-pulse" /> Waiting for admin to confirm fee payment...
                       </p>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No new service requests at the moment.</p>
          )}
        </section>

        <Separator />

        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground/90">Work History</h2>
          {workHistory.length > 0 ? (
            <div className="space-y-4">
              {workHistory.map((req) => (
                <Card key={req.id} className="bg-card/70">
                  <CardHeader>
                     <CardTitle className="text-md flex justify-between items-center">
                       <span>{req.clientServiceNeeded.substring(0, 50)}...</span>
                       <Badge variant={req.status === "rejected_by_provider" ? "destructive" : "secondary"} className="capitalize">
                         {req.status.replace(/_/g, ' ')}
                       </Badge>
                     </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Client: {req.clientName} | Completed: {new Date(req.requestedAt).toLocaleDateString()} 
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Details: {req.clientServiceNeeded}</p>
                    {req.estimatedJobValueByProvider && <p className="text-sm">Value: Rs. {req.estimatedJobValueByProvider.toFixed(2)}</p>}
                  </CardContent>
                   <CardFooter className="flex justify-end">
                      <Button variant="ghost" size="sm">
                         <Eye className="mr-2 h-4 w-4" /> View Details
                      </Button>
                   </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No completed jobs in your history yet.</p>
          )}
        </section>

        <Dialog open={!!selectedRequestForAccept && !showAdminFeeDialog} onOpenChange={(isOpen) => {
            if (!isOpen) setSelectedRequestForAccept(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Accept Service Request</DialogTitle>
              <DialogDescription>
                Enter your estimated charge for the service: "{selectedRequestForAccept?.clientServiceNeeded.substring(0,100)}..."
                This will be shown to the client. An 8% admin fee will be calculated based on this amount.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="estimatedCharge" className="text-right col-span-1">
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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Pay Admin Fee</DialogTitle>
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
                        className="rounded-md border"
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
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl text-primary">
            <MessageSquare className="mr-2 h-6 w-6" />
            User Dashboard
          </CardTitle>
          <CardDescription>
            Welcome to your SewaSathi dashboard. This area is under construction for service seekers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Here you will be able to manage your service requests, view your history, and update your profile.
          </p>
          <div className="mt-6 p-8 border-2 border-dashed border-muted-foreground/30 rounded-lg text-center">
            <p className="text-lg font-semibold text-muted-foreground">Coming Soon!</p>
            <p className="text-sm text-muted-foreground">Exciting features are on their way for service seekers.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
