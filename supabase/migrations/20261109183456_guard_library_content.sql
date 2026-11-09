BEGIN;
-- Freeze all library-edition content, not just job wages and fact copy.
-- Legacy editions are unaffected; routine updates must construct a new draft.
CREATE FUNCTION public.guard_published_library_content() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE old_version uuid; new_version uuid;
BEGIN
 IF TG_OP<>'INSERT' THEN old_version:=OLD.version_id; END IF;
 IF TG_OP<>'DELETE' THEN new_version:=NEW.version_id; END IF;
 IF EXISTS(SELECT 1 FROM public.content_versions v WHERE v.version_id IN (old_version,new_version)
   AND (v.status='published' OR v.published_at IS NOT NULL)
   AND EXISTS(SELECT 1 FROM public.scenario_library_metadata m WHERE m.version_id=v.version_id))
 THEN RAISE EXCEPTION 'Published library content is immutable; create a new draft edition'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END $$;
ALTER FUNCTION public.guard_published_library_content() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.guard_published_library_content() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER scenarios_library_immutable BEFORE INSERT OR UPDATE OR DELETE ON public.scenarios
 FOR EACH ROW EXECUTE FUNCTION public.guard_published_library_content();
CREATE TRIGGER choices_library_immutable BEFORE INSERT OR UPDATE OR DELETE ON public.choices
 FOR EACH ROW EXECUTE FUNCTION public.guard_published_library_content();
CREATE TRIGGER personas_library_immutable BEFORE INSERT OR UPDATE OR DELETE ON public.personas
 FOR EACH ROW EXECUTE FUNCTION public.guard_published_library_content();
CREATE TRIGGER library_metadata_immutable BEFORE INSERT OR UPDATE OR DELETE ON public.scenario_library_metadata
 FOR EACH ROW EXECUTE FUNCTION public.guard_published_library_content();
CREATE TRIGGER library_bill_links_immutable BEFORE INSERT OR UPDATE OR DELETE ON public.scenario_bill_links
 FOR EACH ROW EXECUTE FUNCTION public.guard_published_library_content();
COMMIT;
