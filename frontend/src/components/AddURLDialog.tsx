/** Add / Edit URL dialog using Radix Dialog and React Hook Form. */

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { X, Plus, Edit3, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateURL, useUpdateURL } from '@/hooks/useUrls';
import { toast } from '@/components/Toast';
import type { URLRecord } from '@/types';

interface AddURLDialogProps {
  editingURL?: URLRecord | null;
  onClose?: () => void;
  trigger?: React.ReactNode;
}

interface FormData {
  url: string;
}

export function AddURLDialog({ editingURL, onClose, trigger }: AddURLDialogProps) {
  const [open, setOpen] = React.useState(false);
  const createURL = useCreateURL();
  const updateURL = useUpdateURL();
  const isEditing = !!editingURL;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { url: editingURL?.url || '' },
  });

  // Reset form when editing URL changes
  React.useEffect(() => {
    if (editingURL) {
      reset({ url: editingURL.url });
      setOpen(true);
    }
  }, [editingURL, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && editingURL) {
        await updateURL.mutateAsync({ id: editingURL.id, payload: { url: data.url } });
        toast({ title: 'URL updated', description: data.url, variant: 'success' });
      } else {
        await createURL.mutateAsync({ url: data.url });
        toast({ title: 'URL added', description: `Now monitoring ${data.url}`, variant: 'success' });
      }
      reset({ url: '' });
      setOpen(false);
      onClose?.();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Something went wrong. Please try again.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      reset({ url: '' });
      onClose?.();
    }
  };

  const isLoading = createURL.isPending || updateURL.isPending;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        {trigger || (
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" />
            Add URL
          </button>
        )}
      </Dialog.Trigger>

      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md glass-card p-6"
              >
                <div className="flex items-center justify-between mb-5">
                  <Dialog.Title className="text-lg font-semibold text-foreground flex items-center gap-2">
                    {isEditing ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {isEditing ? 'Edit URL' : 'Add URL'}
                  </Dialog.Title>
                  <Dialog.Close className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </Dialog.Close>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label htmlFor="url-input" className="block text-sm font-medium text-muted-foreground mb-1.5">
                      Website URL
                    </label>
                    <input
                      id="url-input"
                      type="text"
                      placeholder="https://example.com"
                      className="w-full px-3 py-2.5 bg-accent/50 border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-colors"
                      {...register('url', {
                        required: 'URL is required',
                        pattern: {
                          value: /^https?:\/\/.+/,
                          message: 'URL must start with http:// or https://',
                        },
                      })}
                    />
                    {errors.url && (
                      <p className="text-xs text-red-400 mt-1.5">{errors.url.message}</p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-1">
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className="flex-1 px-4 py-2.5 bg-accent/50 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors"
                      >
                        Cancel
                      </button>
                    </Dialog.Close>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {isEditing ? 'Update' : 'Add'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
