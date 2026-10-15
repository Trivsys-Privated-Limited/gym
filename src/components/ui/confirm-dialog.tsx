"use client";
import * as React from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { buttonVariants } from "./button";

interface ConfirmOptions {
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

interface ConfirmDialogProps extends ConfirmOptions {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Confirm", destructive, onConfirm }: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-overlay animate-overlay-in" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-dialog-in focus:outline-none">
          <AlertDialog.Title className="text-lg font-semibold">{title}</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted">{description}</AlertDialog.Description>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel className={buttonVariants({ variant: "outline" })}>Cancel</AlertDialog.Cancel>
            <AlertDialog.Action className={buttonVariants({ variant: destructive ? "danger" : "primary" })} onClick={onConfirm}>
              {confirmLabel}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

/** const confirm = useConfirm(); confirm.ask({...}); render {confirm.element} */
export function useConfirm() {
  const [state, setState] = React.useState<ConfirmOptions | null>(null);
  const element = (
    <ConfirmDialog
      open={state !== null}
      onOpenChange={(o) => !o && setState(null)}
      title={state?.title ?? ""}
      description={state?.description ?? ""}
      confirmLabel={state?.confirmLabel}
      destructive={state?.destructive}
      onConfirm={() => state?.onConfirm()}
    />
  );
  return { ask: setState, element };
}
