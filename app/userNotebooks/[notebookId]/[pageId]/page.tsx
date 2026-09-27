import { EditingPageClient } from "@/components/EditingPage/EditingPageClient";

type EditingPageRouteProps = {
  params: Promise<{
    notebookId: string;
    pageId: string;
  }>;
};

// Route for editing a single notebook page, identified by notebookId and pageId.
export default async function EditingPage({ params }: EditingPageRouteProps) {
  const { notebookId, pageId } = await params;

  // Keyed by page so switching pages mounts a fresh editor instead of reusing the old page's content
  return (
    <EditingPageClient key={pageId} notebookId={notebookId} pageId={pageId} />
  );
}
