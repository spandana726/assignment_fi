/** Confirmation dialog for URL deletion using Radix AlertDialog. */

import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Loader2 } from 'lucide-react';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
  urlName?: string;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  urlName,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <AlertDialog.Portal forceMount>
            <AlertDialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
            </AlertDialog.Overlay>

            <AlertDialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm glass-card p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </div>
                  <AlertDialog.Title className="text-lg font-semibold text-foreground">
                    Delete URL
                  </AlertDialog.Title>
                </div>

                <AlertDialog.Description className="text-sm text-muted-foreground mb-5">
                  Are you sure you want to delete{' '}
                  <span className="text-foreground font-medium">{urlName}</span>?
                  This will permanently remove all monitoring history.
                </AlertDialog.Description>

                <div className="flex gap-3">
                  <AlertDialog.Cancel asChild>
                    <button className="flex-1 px-4 py-2.5 bg-accent/50 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors">
                      Cancel
                    </button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action asChild>
                    <button
                      onClick={onConfirm}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/90 text-white rounded-lg text-sm font-medium hover:bg-red-500 transition-colors disabled:opacity-50"
                    >
                      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Delete
                    </button>
                  </AlertDialog.Action>
                </div>
              </motion.div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        )}
      </AnimatePresence>
    </AlertDialog.Root>
  );
}
