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

  // The editing page switches pages itself, so only the page editor inside is swapped
  return <EditingPageClient notebookId={notebookId} pageId={pageId} />;
}
