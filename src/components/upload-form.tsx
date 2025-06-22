
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ArchiveItem } from "@/lib/types"

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  category: z.string().min(1, "Category is required."),
  description: z.string().min(1, "Description is required."),
  type: z.enum(["text", "image", "audio", "video", "pdf", "word"]),
  content: z.string().optional(),
  file: z.any()
    .optional()
    .refine((value) => {
        if (value instanceof FileList && value.length > 0) {
            return value[0].size <= MAX_FILE_SIZE_BYTES;
        }
        return true;
    }, `File size must be less than ${MAX_FILE_SIZE_MB}MB.`),
  tags: z.string().optional(),
});

export type UploadFormData = z.infer<typeof formSchema>;

type UploadFormProps = {
  onSubmit: (data: UploadFormData) => void;
  itemToEdit?: ArchiveItem;
  allCategories: string[];
  onDone: () => void;
};

export default function UploadForm({ onSubmit, itemToEdit, allCategories, onDone }: UploadFormProps) {
  const form = useForm<UploadFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: itemToEdit?.title || "",
      category: itemToEdit?.category || "",
      description: itemToEdit?.description || "",
      type: itemToEdit?.type || "text",
      content: itemToEdit?.content || "",
      file: undefined,
      tags: itemToEdit?.tags?.join(', ') || "",
    },
  });

  const selectedType = form.watch("type");

  const getAcceptAttribute = () => {
    switch (selectedType) {
      case 'image':
        return 'image/*';
      case 'audio':
        return 'audio/mp3,audio/m4a,audio/mpeg';
      case 'video':
        return 'video/*';
      case 'pdf':
        return 'application/pdf';
      case 'word':
        return '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default:
        return '';
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Reflections on Modern Art" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>File Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a file type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="word">Word Document</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Input placeholder="e.g., Writings, Media" {...field} list="category-suggestions" />
                <datalist id="category-suggestions">
                    {allCategories.map(cat => <option key={cat} value={cat} />)}
                </datalist>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Art History" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., inspiration, draft, final" {...field} />
                </FormControl>
                <FormDescription>
                  Enter tags separated by commas.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {selectedType === 'text' && (
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <FormControl>
                  <Textarea placeholder="Type your text here..." {...field} className="min-h-[150px]" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {selectedType !== 'text' && (
          <FormField
            control={form.control}
            name="file"
            render={({ field }) => (
              <FormItem>
                <FormLabel>File</FormLabel>
                <FormControl>
                  <Input 
                    type="file"
                    accept={getAcceptAttribute()}
                    onChange={(e) => field.onChange(e.target.files)}
                  />
                </FormControl>
                <FormDescription>
                  {itemToEdit?.url ? "Upload a new file to replace the current one." : "Upload a file from your device."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
            <Button type="submit">
              {itemToEdit ? 'Save Changes' : 'Add to Archive'}
            </Button>
        </div>
      </form>
    </Form>
  )
}
