import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Building2, Loader2, CheckCircle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface CreateChurchAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateChurchAccountDialog({ open, onOpenChange, onSuccess }: CreateChurchAccountDialogProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      
      // Calculate trial end date (30 days from now)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 30);
      
      const { data, error } = await supabase
        .from("church_accounts")
        .insert({
          name,
          description: description || null,
          website: website || null,
          billing_email: billingEmail || user.email,
          owner_id: user.id,
          subscription_status: "trial",
          trial_ends_at: trialEndsAt.toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success(t("churchAccount.createSuccess"));
      onOpenChange(false);
      onSuccess();
      // Reset form
      setName("");
      setDescription("");
      setWebsite("");
      setBillingEmail("");
      setAcceptedTerms(false);
    },
    onError: (error: any) => {
      toast.error(error.message || t("churchAccount.createFailed"));
    },
  });

  const features = [
    t("churchAccount.featureCustomRoles"),
    t("churchAccount.featureTeamRotation"),
    t("churchAccount.featurePositionSignup"),
    t("churchAccount.featureWhiteLabel"),
    t("churchAccount.featureCustomDomain"),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {t("churchAccount.create")}
          </DialogTitle>
          <DialogDescription>
            {t("churchAccount.trialDescription")}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">
              {t("churchAccount.churchName")} *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("churchAccount.churchNamePlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {t("churchAccount.churchDescription")}
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("churchAccount.churchDescriptionPlaceholder")}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">
              {t("churchAccount.churchWebsite")}
            </Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder={t("churchAccount.churchWebsitePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingEmail">
              {t("churchAccount.billingEmail")}
            </Label>
            <Input
              id="billingEmail"
              type="email"
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              placeholder={t("churchAccount.billingEmailPlaceholder")}
            />
          </div>

          {/* Trial Features Summary */}
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="font-medium text-sm mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              {t("churchAccount.trialFeatures")}
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {features.map((feature, idx) => (
                <li key={idx}>• {feature}</li>
              ))}
            </ul>
          </div>

          {/* Trial Terms Acceptance */}
          <div className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
            <Checkbox
              id="acceptTerms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="acceptTerms" className="text-xs leading-relaxed cursor-pointer">
              {t("churchAccount.termsAccept")}
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={!name || !acceptedTerms || createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {createMutation.isPending ? t("churchAccount.creating") : t("churchAccount.startTrial")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}