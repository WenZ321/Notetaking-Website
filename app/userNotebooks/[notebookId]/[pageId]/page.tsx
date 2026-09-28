import { EditingPageClient } from "@/components/EditingPage/EditingPageClient";

type EditingPageRouteProps = {
  params: Promise<{
    notebookId: string;
    pageId: string;
  }>;
};

// Route for editing a single notebook page, identified by notebookId and pageId.
export default async function EditingPage({ params }: EditingPageRouteProps) {
  const { notebookId } = await params;

  // The editing page reads the page from the URL itself, so it can switch pages without a route navigation
  return <EditingPageClient notebookId={notebookId} />;
}
