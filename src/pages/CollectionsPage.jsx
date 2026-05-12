import { useNavigate, useOutletContext } from "react-router-dom";
import { CollectionList } from "../components/collections/CollectionList";
import { useCollections } from "../hooks/useCollections";

export function CollectionsPage() {
  const navigate = useNavigate();
  const { session } = useOutletContext();
  const {
    collections,
    collectionsError,
    collectionsLoading,
    createCollection,
    creatingCollection,
  } = useCollections(session.user.id);

  return (
    <CollectionList
      collections={collections}
      creatingCollection={creatingCollection}
      error={collectionsError}
      loading={collectionsLoading}
      onCreateCollection={createCollection}
      onOpenCollection={(collection) => navigate(`/collections/${collection.id}`)}
    />
  );
}
