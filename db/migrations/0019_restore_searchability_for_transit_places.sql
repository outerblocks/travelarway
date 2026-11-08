-- 0018 introduced `is_searchable` with a default of false, which is the right default for a
-- town that has not been put in a dataset yet — but it silently withdrew every SGR station and
-- ferry port from search, because those rows were created before the column existed. A gate
-- that defaults to closed must say who is behind it.
--
-- This lives in a migration rather than a seed on purpose. The station and port rows were
-- imported from reference files that are not part of the repository, so a seed cannot be asked
-- to re-mark them on every environment: the file may not be there. Searchability of a place
-- kind is a property of how the platform works, not of a data drop.

update app.location
   set is_searchable = true,
       updated_at = now()
 where kind in ('station', 'port')
   and is_active
   and not is_searchable;

-- Belt and braces: a station or port that is searchable but deactivated would appear in the
-- picker and then fail on search, because every read path also requires is_active.
update app.location
   set is_searchable = false,
       updated_at = now()
 where not is_active
   and is_searchable;
