import React from "react";
import { Button } from "@/components/ui/button";

interface PaginationControlsProps {
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  page,
  setPage,
  totalPages,
}) => {
  return (
    <div className="flex justify-center items-center gap-4">
      <Button
        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
        disabled={page === 1}
      >
        Previous
      </Button>
      <span>
        Page {page} of {totalPages}
      </span>
      <Button
        onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
        disabled={page === totalPages}
      >
        Next
      </Button>
    </div>
  );
};

export default PaginationControls;
