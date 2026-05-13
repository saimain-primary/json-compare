import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { CompareList } from "../components/compares/CompareList";
import { Breadcrumb } from "../components/layout/CollectionWorkspaceHeader";
import { useCollection } from "../hooks/useCollection";
import { useCompares } from "../hooks/useCompares";

export function CollectionComparesPage() {
  const navigate = useNavigate();
  const { collectionId } = useParams();
  const { openCompareTab, session } = useOutletContext();
  const { collection, collectionError, collectionLoading } = useCollection(
    collectionId,
    session.user.id,
  );
  const {
    compares,
    comparesError,
    comparesLoading,
    createCompare,
    creatingCompare,
  } = useCompares(collectionId, session.user.id);

  if (collectionLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <p className="text-sm font-medium text-zinc-400">Loading collection…</p>
      </div>
    );
  }

  if (collectionError || !collection) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {collectionError || "Collection not found."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Collections", to: "/collections" },
          { label: collection.name },
        ]}
      />

      <CompareList
        collection={collection}
        compares={compares}
        creatingCompare={creatingCompare}
        error={comparesError}
        loading={comparesLoading}
        onCreateCompare={createCompare}
        onOpenCompare={(compare) => {
          openCompareTab?.({
            collectionId: collection.id,
            id: compare.id,
            name: compare.name,
          });
          navigate(`/collections/${collection.id}/compares/${compare.id}`);
        }}
      />
    </div>
  );
}
