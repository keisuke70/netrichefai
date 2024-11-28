import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ClearHistoryDialogProps {
  clearHistory: () => void;
}

const ClearHistoryDialog: React.FC<ClearHistoryDialogProps> = ({
  clearHistory,
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Clear History</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clear Recipe History</DialogTitle>
          <DialogDescription>
            Are you sure you want to clear your entire recipe history? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => {}}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={clearHistory}>
            Clear History
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClearHistoryDialog;
