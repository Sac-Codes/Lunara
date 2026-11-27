-- Shared Bhagavad Gita wisdom library. Apply only after review/approval.

CREATE TABLE IF NOT EXISTS public.wisdom_content (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title text NOT NULL CHECK (length(trim(title)) > 0),
  scripture text NOT NULL DEFAULT 'Bhagavad Gita' CHECK (scripture = 'Bhagavad Gita'),
  chapter integer NOT NULL CHECK (chapter BETWEEN 1 AND 18),
  verse text NOT NULL CHECK (length(trim(verse)) > 0),
  sanskrit text NOT NULL CHECK (length(trim(sanskrit)) > 0),
  transliteration text NOT NULL DEFAULT '',
  meaning text NOT NULL CHECK (length(trim(meaning)) > 0),
  learning text NOT NULL DEFAULT '',
  reflection_prompt text NOT NULL CHECK (length(trim(reflection_prompt)) > 0),
  takeaway text NOT NULL CHECK (length(trim(takeaway)) > 0),
  topic text NOT NULL CHECK (topic IN (
    'Duty & Action', 'Inner Balance', 'Patience', 'Self-Understanding', 'Courage',
    'Detachment', 'Compassion', 'Knowledge', 'Gratitude', 'Inner Peace', 'Focus',
    'Equanimity', 'Purpose'
  )),
  source_note text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  is_featured boolean NOT NULL DEFAULT false,
  is_daily boolean NOT NULL DEFAULT false,
  CONSTRAINT wisdom_content_daily_published CHECK (NOT is_daily OR status = 'published'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wisdom_content_created_at
  ON public.wisdom_content (created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wisdom_content_single_daily
  ON public.wisdom_content (is_daily)
  WHERE is_daily;

DROP TRIGGER IF EXISTS set_wisdom_content_updated_at ON public.wisdom_content;
CREATE TRIGGER set_wisdom_content_updated_at
  BEFORE UPDATE ON public.wisdom_content
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.enforce_single_daily_wisdom()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.is_daily THEN
    UPDATE public.wisdom_content
    SET is_daily = false
    WHERE is_daily AND id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_single_daily_wisdom() FROM PUBLIC;

DROP TRIGGER IF EXISTS enforce_single_daily_wisdom ON public.wisdom_content;
CREATE TRIGGER enforce_single_daily_wisdom
  BEFORE INSERT OR UPDATE OF is_daily ON public.wisdom_content
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_single_daily_wisdom();

ALTER TABLE public.wisdom_content ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.wisdom_content FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.wisdom_content TO authenticated;

DROP POLICY IF EXISTS "wisdom_content_read_authenticated" ON public.wisdom_content;
CREATE POLICY "wisdom_content_read_authenticated"
  ON public.wisdom_content
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "wisdom_content_insert_admin" ON public.wisdom_content;
CREATE POLICY "wisdom_content_insert_admin"
  ON public.wisdom_content
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "wisdom_content_update_admin" ON public.wisdom_content;
CREATE POLICY "wisdom_content_update_admin"
  ON public.wisdom_content
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "wisdom_content_delete_admin" ON public.wisdom_content;
CREATE POLICY "wisdom_content_delete_admin"
  ON public.wisdom_content
  FOR DELETE TO authenticated
  USING (public.is_admin());

INSERT INTO public.wisdom_content (
  id, title, scripture, chapter, verse, sanskrit, transliteration, meaning, learning,
  reflection_prompt, takeaway, topic, source_note, status, is_featured, is_daily,
  created_at, updated_at
)
SELECT seed.id, seed.title, seed.scripture, seed.chapter, seed.verse, seed.sanskrit,
  seed.transliteration, seed.meaning, seed.learning, seed.reflection_prompt,
  seed.takeaway, seed.topic, seed.source_note, seed.status, seed.is_featured,
  seed.is_daily, seed.created_at, seed.updated_at
FROM jsonb_to_recordset($wisdom_seed$
[
  {
    "id": "gita-2-47",
    "title": "Sincere effort over fixation on outcome",
    "scripture": "Bhagavad Gita",
    "chapter": 2,
    "verse": "47",
    "sanskrit": "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥",
    "transliteration": "Karmaṇy-evādhikāras te mā phaleṣu kadācana;\nmā karma-phala-hetur bhūr mā te saṅgo 'stv akarmaṇi.",
    "meaning": "Your rightful sphere is action itself, never clinging to its fruits. Let not the reward of action be your sole motive, nor let yourself drift into inaction.",
    "learning": "Focus on the sincerity and care of what you are doing right now, rather than letting anxiety over the final result consume your attention.",
    "reflection_prompt": "What is one thing you can give your calm attention to today without trying to control how it turns out?",
    "takeaway": "Give your effort fully. Let the outcome unfold.",
    "topic": "Duty & Action",
    "source_note": "Verified Sanskrit text from Bhagavad Gita Chapter 2, Verse 47; original Lunara reflection.",
    "status": "published",
    "is_featured": true,
    "is_daily": true,
    "created_at": "2026-11-26T08:00:00.000Z",
    "updated_at": "2026-11-26T08:00:00.000Z"
  },
  {
    "id": "gita-2-48",
    "title": "Steadiness through ups and downs",
    "scripture": "Bhagavad Gita",
    "chapter": 2,
    "verse": "48",
    "sanskrit": "योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय।\nसिद्ध्यसिद्ध्योः समो भूत्वा समत्वं योग उच्यते॥",
    "transliteration": "Yogasthaḥ kuru karmāṇi saṅgaṁ tyaktvā dhanañjaya;\nsiddhy-asiddhyoḥ samo bhūtvā samatvaṁ yoga ucyate.",
    "meaning": "Act while remaining grounded, letting go of anxious attachment. Remaining even-minded in both success and setback is called steadiness of mind.",
    "learning": "Inner balance does not mean feeling nothing—it means staying anchored in yourself whether a day feels smooth or uncertain.",
    "reflection_prompt": "Where could a little steadiness soften the pressure you feel around succeeding or falling short?",
    "takeaway": "Even-mindedness is a quiet form of strength.",
    "topic": "Inner Balance",
    "source_note": "Verified Sanskrit text from Bhagavad Gita Chapter 2, Verse 48; original Lunara reflection.",
    "status": "published",
    "is_featured": false,
    "is_daily": false,
    "created_at": "2026-11-26T08:00:00.000Z",
    "updated_at": "2026-11-26T08:00:00.000Z"
  },
  {
    "id": "gita-2-14",
    "title": "Seasons of feeling come and pass",
    "scripture": "Bhagavad Gita",
    "chapter": 2,
    "verse": "14",
    "sanskrit": "मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः।\nआगमापायिनोऽनित्यास्तांस्तितिक्षस्व भारत॥",
    "transliteration": "Mātrā-sparśās tu kaunteya śītoṣṇa-sukha-duḥkhadāḥ;\nāgamāpāyino 'nityās tāṁs titikṣasva bhārata.",
    "meaning": "Contacts with the senses bring heat and cold, pleasure and discomfort. They come and go and are impermanent; learn to endure them with patience.",
    "learning": "Difficult moods and bright moods alike move through us like weather. Patience means letting a passing season pass without judging yourself for feeling it.",
    "reflection_prompt": "Is there a discomfort today that feels permanent only because you are right in the middle of it?",
    "takeaway": "Every feeling is weather passing through.",
    "topic": "Patience",
    "source_note": "Verified Sanskrit text from Bhagavad Gita Chapter 2, Verse 14; original Lunara reflection.",
    "status": "published",
    "is_featured": false,
    "is_daily": false,
    "created_at": "2026-11-26T08:00:00.000Z",
    "updated_at": "2026-11-26T08:00:00.000Z"
  },
  {
    "id": "gita-6-5",
    "title": "Becoming a gentle friend to yourself",
    "scripture": "Bhagavad Gita",
    "chapter": 6,
    "verse": "5",
    "sanskrit": "उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।\nआत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥",
    "transliteration": "Uddhared ātmanātmānaṁ nātmānam avasādayet;\nātmaiva hy ātmano bandhur ātmaiva ripur ātmanaḥ.",
    "meaning": "Lift yourself by your own steadiness and do not pull yourself down. Indeed, the self can be one’s own truest friend, or one’s own harshest critic.",
    "learning": "The way we speak to ourselves inside our own thoughts shapes our peace far more than external noise does.",
    "reflection_prompt": "How would you speak to a close friend experiencing the exact day you are having right now?",
    "takeaway": "Meet yourself with the kindness of a friend.",
    "topic": "Self-Understanding",
    "source_note": "Verified Sanskrit text from Bhagavad Gita Chapter 6, Verse 5; original Lunara reflection.",
    "status": "published",
    "is_featured": false,
    "is_daily": false,
    "created_at": "2026-11-26T08:00:00.000Z",
    "updated_at": "2026-11-26T08:00:00.000Z"
  },
  {
    "id": "gita-6-35",
    "title": "Training a restless mind gently",
    "scripture": "Bhagavad Gita",
    "chapter": 6,
    "verse": "35",
    "sanskrit": "असंशयं महाबाहो मनो दुर्निग्रहं चलम्।\nअभ्यासेन तु कौन्तेय वैराग्येण च गृह्यते॥",
    "transliteration": "Asaṁśayaṁ mahā-bāho mano durnigrahaṁ calam;\nabhyāsena tu kaunteya vairāgyeṇa ca gṛhyate.",
    "meaning": "Without doubt, the mind is restless and difficult to steady; yet through patient practice and gentle letting go, it gradually becomes calm.",
    "learning": "A wandering mind is human, not a failure. Returning your attention gently—again and again—is the whole practice.",
    "reflection_prompt": "What small practice helps bring your attention back when your thoughts feel scattered?",
    "takeaway": "Steadiness grows through gentle return, not force.",
    "topic": "Detachment",
    "source_note": "Verified Sanskrit text from Bhagavad Gita Chapter 6, Verse 35; original Lunara reflection.",
    "status": "published",
    "is_featured": false,
    "is_daily": false,
    "created_at": "2026-11-26T08:00:00.000Z",
    "updated_at": "2026-11-26T08:00:00.000Z"
  },
  {
    "id": "gita-12-13",
    "title": "Compassion without harshness",
    "scripture": "Bhagavad Gita",
    "chapter": 12,
    "verse": "13",
    "sanskrit": "अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च।\nनिर्ममो निरहङ्कारः समदुःखसुखः क्षमी॥",
    "transliteration": "Adveṣṭā sarva-bhūtānāṁ maitraḥ karuṇa eva ca;\nnirmamo nirahaṅkāraḥ sama-duḥkha-sukhaḥ kṣamī.",
    "meaning": "One who carries no ill-will toward any being, who is friendly and compassionate, free from possessiveness and pride, balanced in joy and sorrow, and forgiving.",
    "learning": "Compassion begins softly—by noticing where we can offer warmth and patience both to others and to our own imperfections.",
    "reflection_prompt": "Where in your day could a little warmth or forgiveness soften an unnecessary edge?",
    "takeaway": "Patience and friendliness quietly transform a room.",
    "topic": "Compassion",
    "source_note": "Verified Sanskrit text from Bhagavad Gita Chapter 12, Verse 13; original Lunara reflection.",
    "status": "published",
    "is_featured": false,
    "is_daily": false,
    "created_at": "2026-11-26T08:00:00.000Z",
    "updated_at": "2026-11-26T08:00:00.000Z"
  },
  {
    "id": "gita-2-20",
    "title": "The self that never ceases",
    "scripture": "Bhagavad Gita",
    "chapter": 2,
    "verse": "20",
    "sanskrit": "न जायते म्रियते वा कदाचिन्\nनायं भूत्वा भविता वा न भूयः।\nअजो नित्यः शाश्वतोऽयं पुराणो\nन हन्यते हन्यमाने शरीरे॥",
    "transliteration": "Na jāyate mriyate vā kadācin\nnāyaṁ bhūtvā bhavitā vā na bhūyaḥ;\najo nityaḥ śāśvato'yaṁ purāṇo\nna hanyate hanyamāne śarīre.",
    "meaning": "The soul is never born and never dies at any time. It has not come into being, does not come into being, and will not come into being. It is unborn, eternal, ever-existing, and primeval. It is not slain when the body is slain.",
    "learning": "What is deepest in you cannot be diminished by a difficult day, a failure, or a season of grief. The part that witnesses your life is steadier than any circumstance.",
    "reflection_prompt": "What part of you has remained unchanged through the hardest seasons of your life?",
    "takeaway": "You carry something that cannot be taken.",
    "topic": "Self-Understanding",
    "source_note": "Verified Sanskrit text from Bhagavad Gita Chapter 2, Verse 20; original Lunara reflection.",
    "status": "published",
    "is_featured": false,
    "is_daily": false,
    "created_at": "2026-11-26T08:00:00.000Z",
    "updated_at": "2026-11-26T08:00:00.000Z"
  },
  {
    "id": "gita-2-22",
    "title": "Moving through change gracefully",
    "scripture": "Bhagavad Gita",
    "chapter": 2,
    "verse": "22",
    "sanskrit": "वासांसि जीर्णानि यथा विहाय\nनवानि गृह्णाति नरोऽपराणि।\nतथा शरीराणि विहाय जीर्णा-\nन्यन्यानि संयाति नवानि देही॥",
    "transliteration": "Vāsāṁsi jīrṇāni yathā vihāya\nnavāni gṛhṇāti naro'parāṇi;\ntathā śarīrāṇi vihāya jīrṇāny\nanyāni saṁyāti navāni dehī.",
    "meaning": "As a person puts on new garments, giving up old ones, the soul accepts new material bodies, giving up the old and useless ones.",
    "learning": "Change, even when it feels like loss, is part of the natural movement of things. Each ending makes space for a new beginning.",
    "reflection_prompt": "Is there something you are holding onto that may be ready to be gently released?",
    "takeaway": "Endings and beginnings are part of the same turning.",
    "topic": "Detachment",
    "source_note": "Verified Sanskrit text from Bhagavad Gita Chapter 2, Verse 22; original Lunara reflection.",
    "status": "published",
    "is_featured": false,
    "is_daily": false,
    "created_at": "2026-11-26T08:00:00.000Z",
    "updated_at": "2026-11-26T08:00:00.000Z"
  },
  {
    "id": "gita-2-50",
    "title": "Skill in every action",
    "scripture": "Bhagavad Gita",
    "chapter": 2,
    "verse": "50",
    "sanskrit": "बुद्धियुक्तो जहातीह उभे सुकृतदुष्कृते।\nतस्माद्योगाय युज्यस्व योगः कर्मसु कौशलम्॥",
    "transliteration": "Buddhi-yukto jahātīha ubhe sukṛta-duṣkṛte;\ntasmād yogāya yujyasva yogaḥ karmasu kauśalam.",
    "meaning": "One who acts with steady wisdom casts off both good and bad deeds in this life. Therefore strive for yoga — yoga is skill in action.",
    "learning": "The quality of attention you bring to what you do matters more than whether the result is praised or criticized. Skill here means mindful presence.",
    "reflection_prompt": "What would it mean to give your full, calm attention to one task today without rushing ahead to the outcome?",
    "takeaway": "Presence is the highest form of skill.",
    "topic": "Focus",
    "source_note": "Verified Sanskrit text from Bhagavad Gita Chapter 2, Verse 50; original Lunara reflection.",
    "status": "published",
    "is_featured": false,
    "is_daily": false,
    "created_at": "2026-11-26T08:00:00.000Z",
    "updated_at": "2026-11-26T08:00:00.000Z"
  },
  {
    "id": "gita-3-19",
    "title": "Acting without attachment to reward",
    "scripture": "Bhagavad Gita",
    "chapter": 3,
    "verse": "19",
    "sanskrit": "तस्मादसक्तः सततं कार्यं कर्म समाचर।\nअसक्तो ह्याचरन्कर्म परमाप्नोति पूरुषः॥",
    "transliteration": "Tasmād asaktaḥ satataṁ kāryaṁ karma samācara;\nasakto hy ācaran karma param āpnoti pūruṣaḥ.",
    "meaning": "Therefore, without attachment, perform always the work that has to be done; for a person who works without attachment attains the highest.",
    "learning": "When we act for the work itself rather than the applause, the work becomes lighter and the person doing it becomes freer.",
    "reflection_prompt": "What would you do today if nobody was watching or measuring your effort?",
    "takeaway": "Work done without craving its reward is its own quiet freedom.",
    "topic": "Duty & Action",
    "source_note": "Verified Sanskrit text from Bhagavad Gita Chapter 3, Verse 19; original Lunara reflection.",
    "status": "published",
    "is_featured": false,
    "is_daily": false,
    "created_at": "2026-11-26T08:00:00.000Z",
    "updated_at": "2026-11-26T08:00:00.000Z"
  },
  {
    "id": "gita-3-30",
    "title": "Offering your actions forward",
    "scripture": "Bhagavad Gita",
    "chapter": 3,
    "verse": "30",
    "sanskrit": "मयि सर्वाणि कर्माणि संन्यस्याध्यात्मचेतसा।\nनिराशीर्निर्ममो भूत्वा युध्यस्व विगतज्वरः॥",
    "transliteration": "Mayi sarvāṇi karmāṇi sannyasyādhyātma-cetasā;\nnirāśīr nirmamo bhūtvā yudhyasva vigata-jvaraḥ.",
    "meaning": "Surrendering all your actions to me, with your mind focused on the Self, free from longing and possessiveness, fight — released from the fever of ego.",
    "learning": "Acting without the fever of ego means doing your part without excessive anxiety about credit, control, or comparison.",
    "reflection_prompt": "Where might releasing your grip on a particular outcome bring you some relief today?",
    "takeaway": "Do what is yours to do, then release the rest.",
    "topic": "Detachment",
    "source_note": "Verified Sanskrit text from Bhagavad Gita Chapter 3, Verse 30; original Lunara reflection.",
    "status": "published",
    "is_featured": false,
    "is_daily": false,
    "created_at": "2026-11-26T08:00:00.000Z",
    "updated_at": "2026-11-26T08:00:00.000Z"
  },
  {
    "id": "gita-4-7",
    "title": "Renewal in every era",
    "scripture": "Bhagavad Gita",
    "chapter": 4,
    "verse": "7",
    "sanskrit": "यदा यदा हि धर्मस्य ग्लानिर्भवति भारत।\nअभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम्॥",
    "transliteration": "Yadā yadā hi dharmasya glānir bhavati bhārata;\nabhyutthānam adharmasya tadātmānaṁ sṛjāmy aham.",
    "meaning": "Whenever there is a decline of righteousness and a rise of unrighteousness, then I manifest myself anew.",
    "learning": "In difficult times, something within us and around us rises to meet what is needed. Renewal follows periods of decline — in the world and within ourselves.",
    "reflection_prompt": "What within you tends to rise and show up when things feel most difficult?",
    "takeaway": "Difficult times carry the seed of renewal.",
    "topic": "Courage",
    "source_note": "Verified Sanskrit text from Bhagavad Gita Chapter 4, Verse 7; original Lunara reflection.",
    "status": "published",
    "is_featured": false,
    "is_daily": false,
    "created_at": "2026-11-26T08:00:00.000Z",
    "updated_at": "2026-11-26T08:00:00.000Z"
  },
  {
    "id": "gita-4-8",
    "title": "The purpose beneath what is good",
    "scripture": "Bhagavad Gita",
    "chapter": 4,
    "verse": "8",
    "sanskrit": "परित्राणाय साधूनां विनाशाय च दुष्कृताम्।\nधर्मसंस्थापनार्थाय संभवामि युगे युगे॥",
    "transliteration": "Paritrāṇāya sādhūnāṁ vināśāya ca duṣkṛtām;\ndharma-saṁsthāpanārthāya sambhavāmi yuge yuge.",
    "meaning": "To protect those who act rightly, to end the harm caused by those who do not, and to re-establish a way of living that is good — I come into being age after age.",
    "learning": "What is good has a way of persisting and re-establishing itself over time, even when it seems absent for a while.",
    "reflection_prompt": "What small act of goodness can you offer today, without needing to see its full effect?",
    "takeaway": "Goodness does not require a stage — it only requires you.",
    "topic": "Purpose",
    "source_note": "Verified Sanskrit text from Bhagavad Gita Chapter 4, Verse 8; original Lunara reflection.",
    "status": "published",
    "is_featured": false,
    "is_daily": false,
    "created_at": "2026-11-26T08:00:00.000Z",
    "updated_at": "2026-11-26T08:00:00.000Z"
  },
  {
    "id": "gita-4-38",
    "title": "Nothing purifies like true understanding",
    "scripture": "Bhagavad Gita",
    "chapter": 4,
    "verse": "38",
    "sanskrit": "न हि ज्ञानेन सदृशं पवित्रमिह विद्यते।\nतत्स्वयं योगसंसिद्धः कालेनात्मनि विन्दति॥",
    "transliteration": "Na hi jñānena sadṛśaṁ pavitram iha vidyate;\ntat svayaṁ yoga-saṁsiddhaḥ kālenātmani vindati.",
    "meaning": "Indeed there is nothing in this world as purifying as knowledge. One who is perfected in practice finds this within themselves in time.",
    "learning": "Genuine self-understanding — not information, but seeing clearly — dissolves confusion in a way that no distraction can. It arrives quietly, in its own time.",
    "reflection_prompt": "What is something about yourself that you understand now that you could not see before?",
    "takeaway": "Understanding, when it arrives, changes everything quietly.",
    "topic": "Knowledge",
    "source_note": "Verified Sanskrit text from Bhagavad Gita Chapter 4, Verse 38; original Lunara reflection.",
    "status": "published",
    "is_featured": false,
    "is_daily": false,
    "created_at": "2026-11-26T08:00:00.000Z",
    "updated_at": "2026-11-26T08:00:00.000Z"
  },
  {
    "id": "gita-5-10",
    "title": "Acting without being stained by outcomes",
    "scripture": "Bhagavad Gita",
    "chapter": 5,
    "verse": "10",
    "sanskrit": "ब्रह्मण्याधाय कर्माणि सङ्गं त्यक्त्वा करोति यः।\nलिप्यते न स पापेन पद्मपत्रमिवाम्भसा॥",
    "transliteration": "Brahmaṇy ādhāya karmāṇi saṅgaṁ tyaktvā karoti yaḥ;\nlipyate na sa pāpena padma-patram ivāmbhasā.",
    "meaning": "One who offers all actions to the highest, who acts without attachment, is not touched by wrongdoing — just as a lotus leaf, though resting on water, is not wetted by it.",
    "learning": "You can be fully present in the world, doing what needs to be done, without being carried away by every result or disappointment.",
    "reflection_prompt": "Where in your life might more inner stillness be possible, even while you are actively engaged?",
    "takeaway": "The lotus stays dry while resting on water.",
    "topic": "Equanimity",
    "source_note": "Verified Sanskrit text from Bhagavad Gita Chapter 5, Verse 10; original Lunara reflection.",
    "status": "published",
    "is_featured": false,
    "is_daily": false,
    "created_at": "2026-11-26T08:00:00.000Z",
    "updated_at": "2026-11-26T08:00:00.000Z"
  },
  {
    "id": "gita-6-6",
    "title": "When the mind becomes your opposition",
    "scripture": "Bhagavad Gita",
    "chapter": 6,
    "verse": "6",
    "sanskrit": "बन्धुरात्मात्मनस्तस्य येनात्मैवात्मना जितः।\nअनात्मनस्तु शत्रुत्वे वर्तेतात्मैव शत्रुवत्॥",
    "transliteration": "Bandhur ātmātmanas tasya yenātmaivātmanā jitaḥ;\nanātmanas tu śatrutve vartetātmaiva śatruvat.",
    "meaning": "For those who have mastered the self, the self is the best of friends; but for those who have not done so, the self remains hostile, like an enemy.",
    "learning": "The inner critic, the restless anxiety, and the voice of self-doubt are all parts of an untrained mind. Steadiness is cultivated, not found already there.",
    "reflection_prompt": "What does the self-critical voice in you say most often — and is it telling the truth?",
    "takeaway": "Train your inner voice toward friendship rather than judgment.",
    "topic": "Self-Understanding",
    "source_note": "Verified Sanskrit text from Bhagavad Gita Chapter 6, Verse 6; original Lunara reflection.",
    "status": "published",
    "is_featured": false,
    "is_daily": false,
    "created_at": "2026-11-26T08:00:00.000Z",
    "updated_at": "2026-11-26T08:00:00.000Z"
  },
  {
    "id": "gita-6-26",
    "title": "Returning gently each time the mind wanders",
    "scripture": "Bhagavad Gita",
    "chapter": 6,
    "verse": "26",
    "sanskrit": "यतो यतो निश्चरति मनश्चञ्चलमस्थिरम्।\nततस्ततो नियम्यैतदात्मन्येव वशं नयेत्॥",
    "transliteration": "Yato yato niścarati manaś cañcalam asthiram;\ntatas tato niyamyaitad ātmany eva vaśaṁ nayet.",
    "meaning": "Whenever and wherever the mind wanders due to its flickering and unsteady nature, one must bring it back and place it again under the control of the Self.",
    "learning": "Noticing that your mind has drifted and simply returning — without frustration — is the whole practice of staying grounded.",
    "reflection_prompt": "What does it feel like when your attention returns after wandering? Is there any self-judgment in that return?",
    "takeaway": "The return itself is the practice, not the staying.",
    "topic": "Focus",
    "source_note": "Verified Sanskrit text from Bhagavad Gita Chapter 6, Verse 26; original Lunara reflection.",
    "status": "published",
    "is_featured": false,
    "is_daily": false,
    "created_at": "2026-11-26T08:00:00.000Z",
    "updated_at": "2026-11-26T08:00:00.000Z"
  },
  {
    "id": "gita-9-22",
    "title": "What is carried for you when you rest in trust",
    "scripture": "Bhagavad Gita",
    "chapter": 9,
    "verse": "22",
    "sanskrit": "अनन्याश्चिन्तयन्तो मां ये जनाः पर्युपासते।\nतेषां नित्याभियुक्तानां योगक्षेमं वहाम्यहम्॥",
    "transliteration": "Ananyāś cintayanto māṁ ye janāḥ paryupāsate;\nteṣāṁ nityābhiyuktānāṁ yoga-kṣemaṁ vahāmy aham.",
    "meaning": "For those who worship me with undivided devotion, meditating on my form alone, I carry what they lack and preserve what they have.",
    "learning": "There is a kind of restful trust in which we stop trying to control every outcome and allow something larger to hold what we cannot carry alone.",
    "reflection_prompt": "Is there something you have been trying to manage entirely alone that you could trust a little more to unfold on its own?",
    "takeaway": "Some things can be held by forces larger than effort.",
    "topic": "Inner Peace",
    "source_note": "Verified Sanskrit text from Bhagavad Gita Chapter 9, Verse 22; original Lunara reflection.",
    "status": "published",
    "is_featured": false,
    "is_daily": false,
    "created_at": "2026-11-26T08:00:00.000Z",
    "updated_at": "2026-11-26T08:00:00.000Z"
  },
  {
    "id": "gita-9-26",
    "title": "Even the smallest offering, given with love",
    "scripture": "Bhagavad Gita",
    "chapter": 9,
    "verse": "26",
    "sanskrit": "पत्रं पुष्पं फलं तोयं यो मे भक्त्या प्रयच्छति।\nतदहं भक्त्युपहृतमश्नामि प्रयतात्मनः॥",
    "transliteration": "Patraṁ puṣpaṁ phalaṁ toyaṁ yo me bhaktyā prayacchati;\ntad ahaṁ bhakty-upahṛtam aśnāmi prayatātmanaḥ.",
    "meaning": "If one offers to me with devotion a leaf, a flower, a fruit, or water, I accept that loving offering from the pure-hearted.",
    "learning": "What matters is not the grandeur of your offering but the sincerity behind it. Small, genuine acts carry more weight than impressive ones done without care.",
    "reflection_prompt": "What is the smallest genuine thing you offered today — to someone else, or to yourself?",
    "takeaway": "Sincerity matters more than scale.",
    "topic": "Gratitude",
    "source_note": "Verified Sanskrit text from Bhagavad Gita Chapter 9, Verse 26; original Lunara reflection.",
    "status": "published",
    "is_featured": false,
    "is_daily": false,
    "created_at": "2026-11-26T08:00:00.000Z",
    "updated_at": "2026-11-26T08:00:00.000Z"
  },
  {
    "id": "gita-10-20",
    "title": "The quiet centre within all things",
    "scripture": "Bhagavad Gita",
    "chapter": 10,
    "verse": "20",
    "sanskrit": "अहमात्मा गुडाकेश सर्वभूताशयस्थितः।\nअहमादिश्च मध्यं च भूतानामन्त एव च॥",
    "transliteration": "Aham ātmā guḍākeśa sarva-bhūtāśaya-sthitaḥ;\naham ādiś ca madhyaṁ ca bhūtānām anta eva ca.",
    "meaning": "I am the Self, seated in the heart of all beings. I am the beginning, the middle, and the end of all beings.",
    "learning": "There is a quiet awareness at the centre of all living things. When the outer world feels chaotic, this inner ground remains still.",
    "reflection_prompt": "When did you last feel that quality of inner stillness — even briefly? What helped it arrive?",
    "takeaway": "Within the noise, a quiet centre remains.",
    "topic": "Inner Peace",
    "source_note": "Verified Sanskrit text from Bhagavad Gita Chapter 10, Verse 20; original Lunara reflection.",
    "status": "published",
    "is_featured": false,
    "is_daily": false,
    "created_at": "2026-11-26T08:00:00.000Z",
    "updated_at": "2026-11-26T08:00:00.000Z"
  },
  {
    "id": "gita-12-15",
    "title": "Undisturbed and without disturbing",
    "scripture": "Bhagavad Gita",
    "chapter": 12,
    "verse": "15",
    "sanskrit": "यस्मान्नोद्विजते लोको लोकान्नोद्विजते च यः।\nहर्षामर्षभयोद्वेगैर्मुक्तो यः स च मे प्रियः॥",
    "transliteration": "Yasmān nodvijate loko lokān nodvijate ca yaḥ;\nharṣāmarṣa-bhayodvegair mukto yaḥ sa ca me priyaḥ.",
    "meaning": "One who does not disturb the world and is not disturbed by the world, who is free from exhilaration, envy, fear, and agitation — such a person is dear to me.",
    "learning": "A settled person neither floods others with their distress nor is swept away by the turbulence around them. This kind of equanimity is both a gift to others and a form of personal peace.",
    "reflection_prompt": "Where in your life do you find it easiest to stay settled? What makes that easier there?",
    "takeaway": "A calm presence is a generous thing to bring to any room.",
    "topic": "Equanimity",
    "source_note": "Verified Sanskrit text from Bhagavad Gita Chapter 12, Verse 15; original Lunara reflection.",
    "status": "published",
    "is_featured": false,
    "is_daily": false,
    "created_at": "2026-11-26T08:00:00.000Z",
    "updated_at": "2026-11-26T08:00:00.000Z"
  },
  {
    "id": "gita-12-18",
    "title": "Even-minded toward honour and dishonour",
    "scripture": "Bhagavad Gita",
    "chapter": 12,
    "verse": "18–19",
    "sanskrit": "समः शत्रौ च मित्रे च तथा मानापमानयोः।\nशीतोष्णसुखदुःखेषु समः सङ्गविवर्जितः॥\nतुल्यनिन्दास्तुतिर्मौनी सन्तुष्टो येन केनचित्।\nअनिकेतः स्थिरमतिर्भक्तिमान्मे प्रियो नरः॥",
    "transliteration": "Samaḥ śatrau ca mitre ca tathā mānāpamānayoḥ;\nśītoṣṇa-sukha-duḥkheṣu samaḥ saṅga-vivarjitaḥ.\nTulya-nindā-stutir maunī santuṣṭo yena kenacit;\naniketaḥ sthira-matir bhaktimān me priyo naraḥ.",
    "meaning": "One who is equal to friend and foe, in honour and dishonour, in heat and cold, pleasure and pain, free from attachment, equal in blame and praise, silent, content with whatever comes, without a fixed abode, steady in mind, full of devotion — such a person is dear to me.",
    "learning": "Contentment is not a fixed happiness; it is the capacity to remain steady whether the wind is favourable or not.",
    "reflection_prompt": "When did you last feel genuinely content with just what was present — not more, not less?",
    "takeaway": "Steadiness in both directions is worth more than peaks alone.",
    "topic": "Equanimity",
    "source_note": "Verified Sanskrit text from Bhagavad Gita Chapter 12, Verses 18–19; original Lunara reflection.",
    "status": "published",
    "is_featured": false,
    "is_daily": false,
    "created_at": "2026-11-26T08:00:00.000Z",
    "updated_at": "2026-11-26T08:00:00.000Z"
  },
  {
    "id": "gita-16-1",
    "title": "Qualities that make life lighter",
    "scripture": "Bhagavad Gita",
    "chapter": 16,
    "verse": "1–3",
    "sanskrit": "अभयं सत्त्वसंशुद्धिः ज्ञानयोगव्यवस्थितिः।\nदानं दमश्च यज्ञश्च स्वाध्यायस्तप आर्जवम्॥\nअहिंसा सत्यमक्रोधस्त्यागः शान्तिरपैशुनम्।\nदया भूतेष्वलोलुप्त्वं मार्दवं ह्रीरचापलम्॥\nतेजः क्षमा धृतिः शौचमद्रोहो नातिमानिता।\nभवन्ति संपदं दैवीमभिजातस्य भारत॥",
    "transliteration": "Abhayaṁ sattva-saṁśuddhiḥ jñāna-yoga-vyavasthitiḥ;\ndānaṁ damaś ca yajñaś ca svādhyāyas tapa ārjavam.\nAhiṁsā satyam akrodhas tyāgaḥ śāntir apaiśunam;\ndayā bhūteṣv aloluptvaṁ mārdavaṁ hrīr acāpalam.\nTejaḥ kṣamā dhṛtiḥ śaucam adroho nātimānitā;\nbhavanti sampadaṁ daivīm abhijātasya bhārata.",
    "meaning": "Fearlessness, purity of heart, steadfastness in knowledge, generosity, self-restraint, non-violence, truthfulness, freedom from anger, peace, compassion for all beings, freedom from greed, gentleness, modesty, strength, forgiveness, patience — these are the divine qualities.",
    "learning": "These are not requirements to be perfect. They are qualities that, when practiced even a little, make our daily life — and the lives around us — feel lighter.",
    "reflection_prompt": "Which one of these qualities would you like to practice more gently today?",
    "takeaway": "Even one small act of gentleness or patience today is enough.",
    "topic": "Courage",
    "source_note": "Verified Sanskrit text from Bhagavad Gita Chapter 16, Verses 1–3; original Lunara reflection.",
    "status": "published",
    "is_featured": false,
    "is_daily": false,
    "created_at": "2026-11-26T08:00:00.000Z",
    "updated_at": "2026-11-26T08:00:00.000Z"
  },
  {
    "id": "gita-18-46",
    "title": "Finding the sacred in what is yours to do",
    "scripture": "Bhagavad Gita",
    "chapter": 18,
    "verse": "46",
    "sanskrit": "यतः प्रवृत्तिर्भूतानां येन सर्वमिदं ततम्।\nस्वकर्मणा तमभ्यर्च्य सिद्धिं विन्दति मानवः॥",
    "transliteration": "Yataḥ pravṛttir bhūtānāṁ yena sarvam idaṁ tatam;\nsva-karmaṇā tam abhyarcya siddhiṁ vindati mānavaḥ.",
    "meaning": "By worshipping through one's own work the source from which all beings proceed, by whom all this universe is pervaded — a person attains perfection.",
    "learning": "Your ordinary work, done with sincerity and care, is itself a form of devotion. The sacred is not elsewhere — it is in the quality of attention you bring to what is in front of you.",
    "reflection_prompt": "What work or responsibility do you have today that you could approach with a little more care and presence?",
    "takeaway": "The ordinary, done with love, becomes sacred.",
    "topic": "Purpose",
    "source_note": "Verified Sanskrit text from Bhagavad Gita Chapter 18, Verse 46; original Lunara reflection.",
    "status": "published",
    "is_featured": false,
    "is_daily": false,
    "created_at": "2026-11-26T08:00:00.000Z",
    "updated_at": "2026-11-26T08:00:00.000Z"
  },
  {
    "id": "gita-18-66",
    "title": "Letting go and being held",
    "scripture": "Bhagavad Gita",
    "chapter": 18,
    "verse": "66",
    "sanskrit": "सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज।\nअहं त्वा सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः॥",
    "transliteration": "Sarva-dharmān parityajya mām ekaṁ śaraṇaṁ vraja;\nahaṁ tvā sarva-pāpebhyo mokṣayiṣyāmi mā śucaḥ.",
    "meaning": "Abandoning all obligations, take refuge in me alone. I will liberate you from all sins; do not grieve.",
    "learning": "Sometimes the most courageous act is to stop trying to hold everything together by your own effort alone and to allow yourself to rest in trust. Do not grieve.",
    "reflection_prompt": "What would it feel like to genuinely let yourself off the hook for something today — to stop carrying a weight that is not helping you?",
    "takeaway": "You are allowed to put down what you have been carrying. Do not grieve.",
    "topic": "Inner Peace",
    "source_note": "Verified Sanskrit text from Bhagavad Gita Chapter 18, Verse 66; original Lunara reflection.",
    "status": "published",
    "is_featured": false,
    "is_daily": false,
    "created_at": "2026-11-26T08:00:00.000Z",
    "updated_at": "2026-11-26T08:00:00.000Z"
  }
]
$wisdom_seed$::jsonb) AS seed(
  id text, title text, scripture text, chapter integer, verse text, sanskrit text,
  transliteration text, meaning text, learning text, reflection_prompt text,
  takeaway text, topic text, source_note text, status text, is_featured boolean,
  is_daily boolean, created_at timestamptz, updated_at timestamptz
)
WHERE NOT EXISTS (
  SELECT 1 FROM public.wisdom_content existing WHERE existing.id = seed.id
)
ON CONFLICT (id) DO NOTHING;
