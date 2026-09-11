import { EditingPageClient } from "@/components/EditingPage/EditingPageClient";

type EditingPageRouteProps = {
  params: Promise<{
    notebookId: string;
    pageId: string;
  }>;
};

export default async function EditingPage({ params }: EditingPageRouteProps) {
  const { notebookId, pageId } = await params;

  return <EditingPageClient notebookId={notebookId} pageId={pageId} />;
}
