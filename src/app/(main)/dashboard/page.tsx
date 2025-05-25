
"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { mockServiceRequests } from "@/lib/mock-data"; // Using mock data for now
import type { ServiceRequest, ServiceRequestStatus } from "@/lib/types";
import { AlertCircle, CheckCircle, Clock, DollarSign, Eye, MessageSquare, XCircle, Info, LayoutDashboard, Hourglass, UserCog, UserCheck } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
// import { database } from "@/lib/firebase"; // Uncomment when ready for DB operations
// import { ref, update } from "firebase/database"; // Uncomment when ready for DB operations


export default function DashboardPage() {
  const { user, role, loading } = useAuth();
  const { toast } = useToast();
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>(mockServiceRequests);
  const [selectedRequestForAccept, setSelectedRequestForAccept] = useState<ServiceRequest | null>(null);
  const [estimatedCharge, setEstimatedCharge] = useState<number | string>("");
  const [showAdminFeeDialog, setShowAdminFeeDialog] = useState(false);
  const [currentAdminFee, setCurrentAdminFee] = useState(0);


  // Simulate fetching real data if user.uid is available
  // useEffect(() => {
  //   if (role === 'provider' && user?.uid) {
  //     // TODO: Replace with actual Firebase call to fetch requests assigned to this provider
  //     // const assignedRequests = mockServiceRequests.filter(req => req.providerId === user.uid);
  //     // setServiceRequests(assignedRequests);
  //     setServiceRequests(mockServiceRequests); // For demo, show all requests to any provider
  //   } else {
  //     setServiceRequests(mockServiceRequests); // Or relevant data for seeker/admin
  //   }
  // }, [user, role]);


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
    //   // Optionally revert local state change if DB update fails
    // });
  };

  const handleOpenAcceptDialog = (request: ServiceRequest) => {
    setSelectedRequestForAccept(request);
    setEstimatedCharge(""); // Reset previous charge
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
    setSelectedRequestForAccept(null); // Close the initial dialog chain
    toast({ title: "Payment Submitted", description: "Admin fee payment noted. Waiting for admin confirmation." });
  };

  const handleSimulateAdminConfirmation = (requestId: string) => {
    updateRequestStatusLocally(requestId, "accepted_by_provider");
    toast({ title: "Admin Confirmed!", description: "Request accepted. Client details are now visible." });
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
    return (
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-primary">
              <UserCog className="mr-2 h-6 w-6" />
              Admin Dashboard
            </CardTitle>
            <CardDescription>
              Welcome, Admin! Manage platform activities here. (Functionality to be built)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Admin-specific features like user management, request overview, payment confirmations, etc., will be available here.
            </p>
            <div className="mt-6 p-8 border-2 border-dashed border-muted-foreground/30 rounded-lg text-center">
              <p className="text-lg font-semibold text-muted-foreground">Admin Panel Under Construction</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // PROVIDER DASHBOARD
  if (role === 'provider') {
    const recentRequests = serviceRequests.filter(
      req => req.status === "pending_provider_action" || req.status === "pending_admin_fee" || req.status === "awaiting_admin_confirmation"
      // For demo, let's show requests that might be assigned to *any* mock provider
      // If you have a logged-in provider with a specific UID, you'd filter by:
      // && req.providerId === user?.uid 
    ).slice(0, 3); // Show a few mock recent requests for demo

    const workHistory = serviceRequests.filter(
      req => req.status === "job_completed" || req.status === "request_completed" ||  req.status === "rejected_by_provider"
      // && req.providerId === user?.uid 
    ).slice(0, 3); // Show a few mock history items for demo

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

        {/* Recent Service Requests */}
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
                        req.status === "awaiting_admin_confirmation" ? "outline" : "default"
                       } className="capitalize">
                        {req.status.replace(/_/g, ' ')}
                       </Badge>
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      <Clock className="inline h-4 w-4 mr-1" /> Requested: {new Date(req.requestedAt).toLocaleString()} <br />
                      <Info className="inline h-4 w-4 mr-1" /> Category: {req.serviceCategory || "N/A"} <br/>
                      Client Name (Initial): {req.clientName.split(' ')[0]}... {/* Show partial name initially */}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-1"><span className="font-semibold">Location:</span> {req.clientAddress}</p>
                    <p className="text-sm"><span className="font-semibold">Needs:</span> {req.clientServiceNeeded}</p>
                    
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
                    {req.status === "pending_admin_fee" && (
                      <Button variant="secondary" onClick={() => {
                        setSelectedRequestForAccept(req);
                        setCurrentAdminFee(req.adminFeeCalculated || 0);
                        setShowAdminFeeDialog(true);
                      }}>
                        <DollarSign className="mr-2 h-4 w-4" /> Pay Admin Fee (Rs. {req.adminFeeCalculated?.toFixed(2)})
                      </Button>
                    )}
                    {req.status === "awaiting_admin_confirmation" && (
                       <Button variant="outline" onClick={() => handleSimulateAdminConfirmation(req.id)}>
                         <UserCheck className="mr-2 h-4 w-4" /> Simulate Admin Confirmation
                       </Button>
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

        {/* Work History */}
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
                      Client: {req.clientName} | Completed: {new Date(req.requestedAt).toLocaleDateString()} {/* Assuming requestedAt is completion for now */}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Details: {req.clientServiceNeeded}</p>
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

        {/* Dialog for entering estimated charge */}
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

        {/* Dialog for paying admin fee */}
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
                        src="/esewa_admin_qr.png" // Make sure this image is in your /public folder
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
