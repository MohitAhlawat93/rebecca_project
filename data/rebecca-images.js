// Canonical public image library for Risqué Rebecca.
// Combines the preserved archive with the current public Squarespace site audit.
// Squarespace path encodings are normalized before deduplication.
const CDN_PREFIX="https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/";
const expand=(paths)=>paths.map((path)=>CDN_PREFIX+path);

const PROFESSIONAL_PATHS=[
  "fc69b61f-f01d-4b7d-bbdc-cbda1bb67af7/_DSC8589-copy-2.jpg",
  "8550143e-6a70-4f28-b3e3-425982f202dc/_DSC5307-censored.jpg",
  "a8526f48-6156-4e83-8711-a08360f95664/_DSC8193-copy.jpg",
  "c4bcb8eb-8070-4c6e-95b7-98767443e03d/_DSC7015-copy.jpg",
  "fe6e0967-2e8c-42cb-ab8e-2b1932be525c/_DSC8338-copy.jpg",
  "5c265ab8-e471-4242-9456-93dfb7fd251e/_DSC1639-copy.jpg",
  "01dcf3ec-d93f-4cf9-bd75-4fd4f1fbd5cf/_DSC0312-copy.jpg",
  "b81c0c4e-04f3-4fb8-8c00-85eda082497e/_DSC8966-censored.jpg",
  "b6407cc1-df01-450f-bd7e-df8b17a00b6c/_DSC2079-copy.jpg",
  "fe911fd4-b646-4a78-b240-a01f1e947d17/_DSC4655-copy.jpg",
  "d35c3647-45dc-403a-9fea-717c2e7159f3/_DSC7139-censored.jpg",
  "c7f2915b-02cd-4033-a21c-70716e643416/_DSC3527-copy.jpg",
  "0897481e-d4dd-4cde-9884-7f88d8e4b099/_DSC8781-copy.jpg",
  "04454536-91f8-44d4-941a-da3be1203bde/_DSC8088-copy.jpg",
  "d8a8c4b8-3e1d-4397-a2e0-9c2f2cc81c65/_DSC8439-censored.jpg",
  "dfd52774-18c6-4154-b677-95b6211bb962/_DSC5794-copy.jpg",
  "abe1228d-6125-468a-a1f4-9ba651641d8c/_DSC7209-copy-censored.jpg",
  "1ca6b607-68b0-40dc-a376-54dc7287dd29/_DSC5631-censored.jpg",
  "b5bd9e66-3242-40e9-8cc5-156a22c254db/_DSC6786-censored.jpg",
  "362f9153-57d1-49b3-8fb0-c0d420f06c5e/_DSC5384-copy.jpg",
  "025d09c5-6c39-4433-86c0-cab592ad94d3/_DSC4132-copy.jpg",
  "29036824-e479-4f87-a291-97cf27a6adfc/_DSC5670-copy.jpg",
  "33c6e204-4746-492f-a4a3-8991360ca98a/_DSC5850-copy.jpg",
  "b8128c34-b5f4-4995-b4fb-83074c11485f/_DSC0827-copy.jpg",
  "1cf35007-ad07-465a-b597-bbde6a5ae0e8/_DSC9844-copy.jpg",
  "43fe8123-bcbe-4a80-88f5-a1f1a063a5fa/_DSC9244-copy.jpg",
  "90453500-527b-4029-a200-56ca36cada25/_DSC9850-copy.jpg",
  "8feb45ba-dac2-417e-9575-c1977c323868/_DSC6586-copy.jpg",
  "aecc2289-b88c-4237-81a2-480391167031/_DSC4207-copy.jpg",
  "6bebd1c7-9360-40e9-ab82-91df4ad61d87/_DSC8374-censored.jpg",
  "0880df2d-3552-4896-a01e-c4cee47c0b14/_DSC9200-copy.jpg",
  "5123b6bb-49ba-49d0-a517-bd6b0f78f568/_DSC7850-censored.jpg",
  "2380b139-2528-4e3f-993b-10b08b4d8675/_DSC8453-copy.jpg",
  "2b883ed8-ef4a-42f8-b957-35734cdacf80/_DSC8677-copy.jpg",
  "ede1df29-536a-4398-8511-98d26c3187b8/_DSC8011-copy.jpg",
  "2ca283eb-d85a-4d40-9c6e-53b38d339d81/_DSC8859-copy.jpg",
  "b1c39acf-72b5-4b36-b1c1-19a0f16ec17a/_DSC9687-copy.jpg",
  "cda55cdb-f75d-4069-b52b-2ef8da42da7f/_DSC9512-copy.jpg",
  "dea45b86-a731-4031-ab7f-97b1b0ef4aaa/_DSC9781-copy.jpg",
  "79b7180c-8aeb-4491-9a59-58bff4d2d69e/processed_I62A3592+copy.jpeg",
  "07dae98f-dd47-4faa-b37b-cd2624955ae0/processed__DSC9066.jpeg",
  "aa8270ef-b44f-4140-8de2-7a539c3166ed/processed_REO_0304+copy.jpeg",
  "1cd3c79a-b2d5-459a-b779-40415075ab10/processed_REO_0217+copy.jpeg",
  "529cc1e6-def4-40ef-9d9c-2e315427625d/processed_REO_0243+copy.jpeg",
  "2f848240-f27a-416f-98c2-58470295abbc/processed_REO_0449-censored.jpeg",
  "dc4f2cfa-a5cf-4c89-b0c4-11942181305d/processed_REO_0295.jpeg",
  "037e3ff1-cd05-4148-942e-ec4916669722/processed__DSC1095.jpeg",
  "b13ade9f-3eb4-4c06-b2e6-6acc3cffcfe0/processed_I62A3578.jpeg",
  "40767232-cddc-4425-b174-198f3e0735ad/processed_I62A3734+copy.jpeg",
  "06a1c402-78d3-4ee8-9213-68cca336cb83/processed_I62A3603+copy.jpeg",
  "51de9738-a37b-4774-b6b9-3366e26e7c21/processed_I62A3677+copy.jpeg",
  "35715dec-d6c9-44eb-8aae-369af3475e21/processed__DSC6472.jpeg",
  "775ebe85-20b2-40cd-b527-b3775cecb560/processed__DSC9674-censored.jpeg",
  "dee1601e-bb8a-47ee-adaf-5969b584094a/processed__DSC0883.jpeg",
  "06f0a7a8-5e1d-43ed-8886-a1e25aa911b7/processed__DSC6903.jpeg",
  "6deb9483-e1d9-4111-a070-f2dca3ca798a/processed__DSC6739.jpeg",
  "6d5a1911-e6a1-4bde-88b5-a661f2dcd0a5/processed__DSC2225+censored.jpeg",
  "99b38e86-343e-44c3-bbba-4a25795de02e/processed__DSC0635+censored.jpeg",
  "6dc30d9f-1ee0-40e0-aa17-21d6ea8d3335/processed__DSC2104.jpeg",
  "c71bcf28-962a-4ee3-b36d-36a4aecf1436/processed__DSC7778.jpeg",
  "835244ac-4e26-4406-aec5-5d6f49a513b5/processed__DSC5812.jpeg",
  "92a725ac-365a-43cc-8a87-052f2f65b8ab/processed__DSC1982-blur.jpeg",
  "0f00084a-d602-4b38-87ab-1741dccdaa08/processed__DSC6211+copy.jpeg",
  "ede636fb-0882-486b-a45c-a2cf5753fc13/processed__DSC5732.jpeg",
  "9809cc84-a3b5-40b3-b2ce-6c57b526563e/processed__DSC5535.jpeg",
  "326dfa50-6832-4638-8339-1c5faa64a8b6/processed__DSC2442+copy.jpeg",
  "e6669e3e-2508-4d14-84a1-4c6a367499bf/processed__DSC0675+censored.jpeg",
  "40446109-dd65-4865-9180-de0ff9f036df/4N3A4991.png",
  "383efab0-8d1b-42e5-aa5d-9c1ec3ddba99/4N3A4985+copy.png",
  "e79c199c-4fbf-4913-87a4-fb66c2f432b5/4N3A5035.png",
  "a231659b-51a3-489d-a434-161d98763004/4N3A1716+copy+2.jpg",
  "ef36eb67-1534-4d19-b83f-39662b02f3ad/4N3A5296+copy.png",
  "25373298-09e1-465c-b3f8-77a85415ca62/4N3A5066-2.png",
  "0b85d9b3-0a73-4c18-8540-e35f8d34adb3/I62A9222+copy+2.jpg",
  "98592ef8-1a58-4619-a818-9f8eda16b2bf/4N3A5083+copy.png",
  "044d0e4d-6bb7-45f8-9b2c-b323ec076582/4N3A5101.png",
  "75e5f163-303d-4526-a84e-2cd95289803d/4N3A5258.png",
  "9f9fc43c-a735-431a-a9f8-22a8b4362219/IMG_7245.JPG",
  "de9d093d-f730-422c-8c60-a2ba0df7b9c7/4N3A1684+copy+2.jpg",
  "1cbf2a3d-20c4-4cc0-a4a2-8dfbf0846ad6/processed__DSC2019.jpeg",
  "ca11dc16-006a-4887-9605-24a7b9131a2f/I62A9023+copy+2.jpg"
];
const CANDID_PATHS=[
  "9b5f9b93-122a-428f-bf1f-cf697df4c4e1/photo_2026-02-28+00.40.18.jpeg",
  "d97fc01e-c8ab-47c0-b6a2-e8aaf2f98534/photo_2026-02-28+00.38.47.jpeg",
  "8e7f0798-c0a2-4b0b-81f1-159427df66da/photo_2026-02-28+00.38.36.jpeg",
  "2aeb3c6a-2207-4f7c-9f33-35d54e9c6074/photo_2026-02-28+00.40.31.jpeg",
  "9c38d303-659a-456f-a025-31d29f8dee47/photo_2026-02-28+00.40.23.jpeg",
  "0ce8d08d-62d7-4a16-a499-96e5743da413/photo_2026-02-28+00.39.22.jpeg",
  "3fa76d75-671a-4c55-878e-8776544adf8c/photo_2026-01-04+21.36.40.jpeg",
  "f58506fa-c91b-412b-a58c-b2eba6fab3ef/photo_2026-02-28+00.39.58.jpeg",
  "8cb1b415-2bb3-4eba-9a5f-8c61b68f2658/photo_2025-12-29+19.21.18.jpeg",
  "a3d93733-d5e3-4add-ae37-93138ace2709/photo_2026-02-28+00.39.45.jpeg",
  "cf3f2810-9c63-4358-ab24-daadc19d9840/photo_2026-01-04+21.36.59.jpeg",
  "e0ee077d-cc1d-4032-9c3c-9c80ac31ec67/photo_2026-02-28+00.39.00.jpeg",
  "8489733a-9fff-4d92-b5ce-600b244eac5d/photo_2025-12-29+19.19.37.jpeg",
  "7f265ce1-2aed-4948-8801-ec8f8b96ab33/photo_2025-12-29+19.12.01.jpeg",
  "35001162-d773-43aa-83d6-c5237f72e745/photo_2026-02-28+00.39.12.jpeg",
  "288f26fa-5862-4d25-8d43-c310c853a49b/photo_2025-12-29+22.30.53.jpeg",
  "f1ff560b-9443-4912-b66c-b477cd8d50f6/photo_2026-02-28+00.39.49.jpeg",
  "56dc7b3b-1cea-45b4-b13c-c94403026e27/photo_2025-12-29+19.19.29.jpeg",
  "5cb08726-ba94-4480-a02a-50e1f31afdfe/photo_2025-12-29+22.31.17.jpeg",
  "d424b9a6-d04b-4e21-9f33-4aaeb5165b7d/photo_2026-02-28+00.38.42.jpeg",
  "0d8a7d93-9f14-458c-8fa0-5b5fe6e86acd/photo_2026-02-28+00.39.41.jpeg",
  "27cc0209-782d-4a90-a132-592635035d03/IMG_5473.JPG",
  "f4282038-8064-4a70-8d2f-114831b657b2/photo_2025-12-29+19.11.38.jpeg",
  "bc540a6e-7c2d-4b15-bb8f-728b8850614a/photo_2026-02-28+00.39.27.jpeg",
  "ba9904d7-02d0-4259-bd42-b0f02cbcedf5/photo_2025-12-29+19.11.33.jpeg",
  "2193fce7-c8c9-4739-aa67-431f4a31e989/IMG_6739.JPG",
  "0c386b42-d992-4994-98d1-fe6e55f9a7ee/rsz_1img_7035.jpg",
  "e4037d1c-843c-4af1-a7e6-2fb72ac50086/rsz_img_6141.jpg",
  "e09ef66f-b064-4125-9716-9977d28dd590/2025-10-18+01.48.10.jpg",
  "6dc8b852-8083-4f39-883b-44069a3268c5/IMG_9484.JPG",
  "2555685b-2ec7-4871-9e5a-95bbe55de97d/IMG_4410.jpg",
  "259e9deb-60ec-4f1c-9bd2-62a9341d6a32/IMG_5474.JPG",
  "da782917-2cc9-41ca-94cc-65b268056b58/IMG_4958+(1).jpg",
  "9857396f-2f6c-424b-9d19-6c8d4e097506/IMG_3199.jpg",
  "f529c775-8fa1-468a-9134-d7d44bf4b9c8/photo_2025-09-24+23.44.14.jpeg",
  "04cdc356-e195-4b31-ad4a-d5990411d2ba/IMG005.jpg",
  "4d879f95-d38f-44c8-abf4-bdbc653887c0/photo_2025-09-24+23.43.45.jpeg",
  "eaa1df9a-41df-4964-9f6b-0c5f5f5a8c81/IMG_3200.jpg",
  "fd61c8f2-932d-4901-a60e-76bf44bdc04f/IMG_0696.jpg",
  "02b2a426-3fce-4c62-8249-d688656335cf/IMG_2740.JPG",
  "4eb8ba7d-ec76-4ba3-8ca5-90eb61b75f52/IMG_6885.JPG",
  "5e65369d-320b-4a6d-af50-07bfa0b92c8f/ADK_0099.JPG",
  "484e1606-9c6d-4c7b-9ccd-6448b9178c37/IMG009(2).jpg",
  "cf136d12-6e08-4648-bb3f-340b8f641b55/IMG003(1).jpg",
  "04e8c029-c6d8-41ad-b2dd-003098ddc2a1/2026-09-03+10.59.28.jpg",
  "03a00e0d-22f6-411c-9a11-3de5dd07a2db/IMG_7114.JPG",
  "0e1f117f-99ef-46d0-90e4-3d81d84ac79d/IMG_6710.JPG",
  "fb89a54f-2ef6-4b51-b758-11320ea3e844/IMG_7122.JPG",
  "6c2bcd9d-8d28-415c-975e-aca0a086c54d/IMG_6705.JPG",
  "526846d2-26e2-4560-bb64-b57ab35fc3bf/2026-09-03+10.59.38.jpg",
  "f2dc8906-1f3b-4bf1-a2b7-65c64d6ebdf7/2026-09-03+11.01.28.jpg",
  "9357b5b7-bcb0-43e5-a04e-3d3c5ba638c3/IMG_7123.JPG",
  "14d3ba12-28e5-4122-9b4f-b9c2fe22ecdb/2026-09-03+11.38.53.jpg",
  "d1565a84-a77e-4223-8656-fdd681afd6d2/IMG_5171.JPG",
  "785b5c8e-12c9-456a-b3fb-e4fd102eed39/IMG_5176.JPG",
  "67cda44b-afe6-4a9f-a51c-a9d1888d63e7/photo_2026-08-12+22.36.39.jpeg",
  "e61ed5c2-6a47-43a6-90e5-a0220caf2a4d/016785D7-7AC3-4FFA-8540-C740A7C8D246.JPG",
  "c3416f3d-9c9f-445c-9930-b502042f9204/photo_2026-08-12+22.36.12.jpeg",
  "84225249-46a0-469d-ba06-f426c30c7866/IMG_2644+(1).JPG",
  "024b9cce-6250-42a8-a585-5563bd3a4baa/photo_2026-08-12+22.20.28.jpeg",
  "f03000b4-3fa1-4531-9997-eedb2a9e64bf/IMG_1113+(1).JPG",
  "6d375ab6-ab84-4bc6-a65e-0e5b5c10f9ae/photo_2026-08-12+22.40.50.jpeg",
  "608a5845-b47c-48bc-ab38-3fbb0cdb343f/IMG_2184+(1).jpg",
  "67288183-de5b-4486-9cf3-286269a9df2b/photo_2026-08-12+22.40.54.jpeg",
  "5ccaed6d-a773-4d19-a053-87fb34e94435/IMG_3963+(1).JPG",
  "0eec78f1-9b92-45e8-a67e-759486cf02df/photo_2026-08-12+22.40.18.jpeg",
  "17d7f589-1061-4fc5-aae3-d804b4bd8d79/photo_2026-08-12+22.39.46.jpeg",
  "1842d1e6-da56-4c80-b983-ab371e3e7757/photo_2026-08-12+22.36.54.jpeg",
  "a439c995-e161-42d9-9171-b4af18c8335a/IMG_2399+(1).JPG",
  "83479e0d-006b-43a1-a1e4-7b26740a305f/photo_2026-08-12+22.36.24.jpeg",
  "d1d1c5c6-9f03-4e45-9dbe-8f111f34660f/photo_2026-08-12+22.40.36.jpeg",
  "ca062c8d-7584-4e94-b16a-5cdd2c2bca91/IMG_3965+(1).JPG",
  "05c3ae9d-e31f-4efd-bae2-73d510a27b75/photo_2026-08-12+22.21.27.jpeg",
  "15d85431-c1c5-42c7-a775-afe382fdf0e2/IMG_0182.JPG",
  "95dfad3e-6fae-4a71-9939-75fdaa7e4883/IMG_0852.jpg",
  "ff848baf-4e13-4a72-8f10-def6004add55/IMG_2750.JPG",
  "da99c397-5d46-4c38-a3c6-c0bfffa16293/photo_2026-08-12+22.36.59.jpeg",
  "1dbf3396-d21f-471b-a5a1-981ba684638f/0C10242D-5635-418C-A1F5-DA1B656842F7.JPG",
  "c6b89a9c-9d4b-4371-9c39-8b342c7e3228/IMG_7039.JPG",
  "0af92bea-f350-4a38-a6fa-833247a53bde/photo_2026-08-12+22.38.34.jpeg",
  "d05672cc-ee97-4df4-89a6-b9e38ade54d3/photo_2026-08-12+22.40.21.jpeg",
  "1db316e6-2690-4b80-a2a5-05bfddc88e9a/IMG_0609.jpg"
];
const CURRENT_SITE_ONLY_PATHS=[
  "6747ec77-2b4b-4697-8493-c7c1cf933b2b/IMG_5226.jpg",
  "84079182-80ba-4cdd-8af3-fc7bcb649b41/23rt.jpg",
  "f5d023de-204a-4743-9ccc-8460bcf98a53/_DSC6037-copy.jpg",
  "2c2386d9-20af-4d89-a50d-4d37a010762e/summer-song-03.jpg",
  "5d1d9085-6301-4bdb-98f8-6f5254ef4173/IMG_5238.jpg",
  "abfbd39b-0837-4fb0-8afc-8c48a4881e3e/7.jpg",
  "bdbd8684-6a02-4206-baee-ed5976beaf25/_DSC3573-copy.jpg",
  "34a119f4-e6f4-489a-8c08-a643b234837b/processed_205+copy.jpeg",
  "bcd624d6-3283-4be6-b346-4eae05dd4ea0/Facetune_09-10-2024-10-37-40.jpg",
  "cba754ff-fb8b-4615-94c9-7359180c494e/processed__DSC1314.jpeg",
  "8542115c-d4b6-4394-91e4-85f19141f464/23rt.jpg",
  "7d78aedf-584f-401f-86df-e800138dc6cb/362rt.jpg",
  "caab7870-1e80-422a-af13-f9788dcf44c9/I62A9120+copy+2.jpg",
  "fb15ac91-e86b-4ca7-8b01-d32acd43dca7/I62A9197+copy+2.jpg",
  "1766317720487-O2CK6IERG98E15EDKNWL/unsplash-image-WuSq0y55fkc.jpg",
  "1766317647977-UEE6ODW45ORSVTDP5EUU/unsplash-image-6rDbvXzIVpQ.jpg",
  "1766317675311-7VFIAO5T1685S68QLHT1/unsplash-image-Q6UehpkBSnQ.jpg",
  "1782133744094-VTB2FQHGNOMH3N5XPCDJ/unsplash-image-BdgWxoO-jbc.jpg",
  "1766317575530-CY3GCK8ETK8DWP8BTH8T/unsplash-image-JmuyB_LibRo.jpg",
  "1766317333455-QGXJPKCKU3JE4NEJWH4M/unsplash-image-yBroAF1cN3I.jpg",
  "b9694a65-b038-449d-8dac-7d09f147cc5c/delphinium+blue+pattern3.png",
  "311dc85f-e287-482e-b394-f9a014a7e22b/14rt.jpg",
  "b0d3deba-ecd1-43cc-8d8c-11a92720e915/1rt.jpg"
];

export const REBECCA_IMAGES={
  audit:{
    source:'https://www.risquerebecca.com',
    auditedAt:'2026-10-06',
    currentSiteUnique:133,
    preservedRepoProfessional:67,
    preservedRepoCandid:44,
    currentOriginalProfessional:41,
    currentOriginalCandid:61,
    normalizedPathEncoding:true
  },
  professional:expand(PROFESSIONAL_PATHS),
  candid:expand(CANDID_PATHS),
  archiveTotal:163,
  currentSiteOnly:expand(CURRENT_SITE_ONLY_PATHS),
  curated:{
  "hero": [
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/fc69b61f-f01d-4b7d-bbdc-cbda1bb67af7/_DSC8589-copy-2.jpg",
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/8550143e-6a70-4f28-b3e3-425982f202dc/_DSC5307-censored.jpg",
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/a8526f48-6156-4e83-8711-a08360f95664/_DSC8193-copy.jpg",
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/c4bcb8eb-8070-4c6e-95b7-98767443e03d/_DSC7015-copy.jpg"
  ],
  "about": [
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/fe6e0967-2e8c-42cb-ab8e-2b1932be525c/_DSC8338-copy.jpg",
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/5c265ab8-e471-4242-9456-93dfb7fd251e/_DSC1639-copy.jpg",
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/01dcf3ec-d93f-4cf9-bd75-4fd4f1fbd5cf/_DSC0312-copy.jpg"
  ],
  "reviews": [
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/b6407cc1-df01-450f-bd7e-df8b17a00b6c/_DSC2079-copy.jpg",
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/fe911fd4-b646-4a78-b240-a01f1e947d17/_DSC4655-copy.jpg",
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/d35c3647-45dc-403a-9fea-717c2e7159f3/_DSC7139-censored.jpg"
  ],
  "travel": [
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/0897481e-d4dd-4cde-9884-7f88d8e4b099/_DSC8781-copy.jpg",
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/04454536-91f8-44d4-941a-da3be1203bde/_DSC8088-copy.jpg",
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/d8a8c4b8-3e1d-4397-a2e0-9c2f2cc81c65/_DSC8439-censored.jpg"
  ],
  "favourites": [
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/abe1228d-6125-468a-a1f4-9ba651641d8c/_DSC7209-copy-censored.jpg",
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/1ca6b607-68b0-40dc-a376-54dc7287dd29/_DSC5631-censored.jpg",
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/b5bd9e66-3242-40e9-8cc5-156a22c254db/_DSC6786-censored.jpg"
  ],
  "aboutFeature": [
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/b1c39acf-72b5-4b36-b1c1-19a0f16ec17a/_DSC9687-copy.jpg",
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/cda55cdb-f75d-4069-b52b-2ef8da42da7f/_DSC9512-copy.jpg",
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/dea45b86-a731-4031-ab7f-97b1b0ef4aaa/_DSC9781-copy.jpg"
  ],
  "favouritesHero": [
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/8feb45ba-dac2-417e-9575-c1977c323868/_DSC6586-copy.jpg",
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/aecc2289-b88c-4237-81a2-480391167031/_DSC4207-copy.jpg",
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/6bebd1c7-9360-40e9-ab82-91df4ad61d87/_DSC8374-censored.jpg"
  ],
  "journal": [
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/0880df2d-3552-4896-a01e-c4cee47c0b14/_DSC9200-copy.jpg",
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/5123b6bb-49ba-49d0-a517-bd6b0f78f568/_DSC7850-censored.jpg",
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/2380b139-2528-4e3f-993b-10b08b4d8675/_DSC8453-copy.jpg"
  ],
  "press": [
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/2b883ed8-ef4a-42f8-b957-35734cdacf80/_DSC8677-copy.jpg",
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/ede1df29-536a-4398-8511-98d26c3187b8/_DSC8011-copy.jpg",
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/2ca283eb-d85a-4d40-9c6e-53b38d339d81/_DSC8859-copy.jpg"
  ],
  "galleryProfessional": [
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/79b7180c-8aeb-4491-9a59-58bff4d2d69e/processed_I62A3592+copy.jpeg",
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/07dae98f-dd47-4faa-b37b-cd2624955ae0/processed__DSC9066.jpeg",
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/aa8270ef-b44f-4140-8de2-7a539c3166ed/processed_REO_0304+copy.jpeg"
  ],
  "galleryCandid": [
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/9b5f9b93-122a-428f-bf1f-cf697df4c4e1/photo_2026-02-28+00.40.18.jpeg",
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/d97fc01e-c8ab-47c0-b6a2-e8aaf2f98534/photo_2026-02-28+00.38.47.jpeg",
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/8e7f0798-c0a2-4b0b-81f1-159427df66da/photo_2026-02-28+00.38.36.jpeg"
  ],
  "dateIdeas": [
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/025d09c5-6c39-4433-86c0-cab592ad94d3/_DSC4132-copy.jpg",
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/29036824-e479-4f87-a291-97cf27a6adfc/_DSC5670-copy.jpg",
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/33c6e204-4746-492f-a4a3-8991360ca98a/_DSC5850-copy.jpg"
  ],
  "etiquette": [
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/1cf35007-ad07-465a-b597-bbde6a5ae0e8/_DSC9844-copy.jpg",
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/43fe8123-bcbe-4a80-88f5-a1f1a063a5fa/_DSC9244-copy.jpg",
    "https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/90453500-527b-4029-a200-56ca36cada25/_DSC9850-copy.jpg"
  ]
}
};

const isSquarespaceImage=(url='')=>String(url).includes('images.squarespace-cdn.com');
export function imageVariant(url,width){
  return isSquarespaceImage(url) ? `${url}?format=${width}w` : url;
}
export function imageSrcset(url,widths=[300,500,750,1000,1500]){
  return isSquarespaceImage(url)
    ? widths.map((w)=>`${imageVariant(url,w)} ${w}w`).join(', ')
    : url;
}
