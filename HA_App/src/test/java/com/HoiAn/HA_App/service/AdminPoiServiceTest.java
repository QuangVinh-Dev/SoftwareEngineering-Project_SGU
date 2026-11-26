package com.HoiAn.HA_App.service;

import com.HoiAn.HA_App.entity.Poi;
import com.HoiAn.HA_App.repository.PoiRepository;
import com.HoiAn.HA_App.repository.PoiImageRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;
import java.util.List;
import com.HoiAn.HA_App.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;
import java.lang.reflect.Field;
import java.nio.file.Path;

@ExtendWith(MockitoExtension.class)
class AdminPoiServiceTest {
    @Mock private PoiRepository pois;
    @Mock private AdminPoiContentService contentService;
    @Mock private PoiImageRepository poiImages;
    @Mock private PoiImageStorageService imageStorage;

    @Test
    void createsPersistedPoiUsingExistingEntityFields() throws Exception {
        when(pois.save(any(Poi.class))).thenAnswer(invocation -> savedWithId(invocation.getArgument(0), 1));
        when(poiImages.findPaths(1)).thenReturn(List.of());
        AdminPoiService service = new AdminPoiService(pois, contentService, poiImages, imageStorage);
        var request = new AdminPoiService.PoiMutationRequest("  Test POI  ", new BigDecimal("15.123456"),
                new BigDecimal("108.123456"), 30, 2, "Vietnamese narration", null, "ACTIVE");

        var response = service.create(request);

        ArgumentCaptor<Poi> captor = ArgumentCaptor.forClass(Poi.class);
        verify(pois).save(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("Test POI");
        assertThat(captor.getValue().getOriginalDescription()).isEqualTo("Vietnamese narration");
        assertThat(response.latitude()).isEqualByComparingTo("15.123456");
        assertThat(response.status()).isEqualTo("ACTIVE");
        assertThat(response.approvalStatus()).isEqualTo("APPROVED");
        assertThat(response.id()).isEqualTo(1);
    }

    @Test
    void ownerSubmissionStartsPendingAndBelongsToMerchant() throws Exception {
        when(pois.save(any(Poi.class))).thenAnswer(invocation -> savedWithId(invocation.getArgument(0), 2));
        when(poiImages.findPaths(2)).thenReturn(List.of());
        AdminPoiService service = new AdminPoiService(pois, contentService, poiImages, imageStorage);

        var response = service.createForMerchant(17, request(), List.of());

        ArgumentCaptor<Poi> captor = ArgumentCaptor.forClass(Poi.class);
        verify(pois).save(captor.capture());
        assertThat(captor.getValue().getMerchantId()).isEqualTo(17);
        assertThat(captor.getValue().getApprovalStatus()).isEqualTo("PENDING");
        assertThat(response.approvalStatus()).isEqualTo("PENDING");
    }

    @Test
    void uploadCannotExceedFiveImagesForPoi() throws Exception {
        when(pois.save(any(Poi.class))).thenAnswer(invocation -> savedWithId(invocation.getArgument(0), 3));
        when(poiImages.count(3)).thenReturn(5);
        AdminPoiService service = new AdminPoiService(pois, contentService, poiImages, imageStorage);
        var image = new MockMultipartFile("images", "poi.jpg", "image/jpeg", new byte[]{1});

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.create(request(), List.of(image)))
                .isInstanceOf(ApiException.class)
                .extracting(error -> ((ApiException) error).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        verifyNoInteractions(imageStorage);
        verify(poiImages).lockPoi(3);
    }

    @Test
    void updateReplacesExistingImagesInsteadOfCountingThemAgainstNewImages() throws Exception {
        Poi poi = savedWithId(new Poi(), 5);
        poi.setName("Test POI");
        when(pois.findById(5)).thenReturn(java.util.Optional.of(poi));
        when(pois.save(any(Poi.class))).thenAnswer(invocation -> invocation.getArgument(0));
        List<String> oldPaths = List.of("/uploads/poi-images/old-1.jpg",
                "/uploads/poi-images/old-2.jpg", "/uploads/poi-images/old-3.jpg");
        when(poiImages.findPaths(5)).thenReturn(oldPaths,
                List.of("/uploads/poi-images/new-1.jpg", "/uploads/poi-images/new-2.jpg",
                        "/uploads/poi-images/new-3.jpg"));
        List<MultipartFile> images = List.of(
                new MockMultipartFile("images", "new-1.jpg", "image/jpeg", new byte[]{1}),
                new MockMultipartFile("images", "new-2.jpg", "image/jpeg", new byte[]{2}),
                new MockMultipartFile("images", "new-3.jpg", "image/jpeg", new byte[]{3}));
        when(imageStorage.storeAll(images)).thenReturn(List.of(
                new PoiImageStorageService.StoredImage(Path.of("new-1.jpg"), "/uploads/poi-images/new-1.jpg"),
                new PoiImageStorageService.StoredImage(Path.of("new-2.jpg"), "/uploads/poi-images/new-2.jpg"),
                new PoiImageStorageService.StoredImage(Path.of("new-3.jpg"), "/uploads/poi-images/new-3.jpg")));
        AdminPoiService service = new AdminPoiService(pois, contentService, poiImages, imageStorage);

        var response = service.update(5, request(), images);

        verify(poiImages).deleteAll(5);
        verify(poiImages).add(5, "/uploads/poi-images/new-1.jpg", 1);
        verify(poiImages).add(5, "/uploads/poi-images/new-2.jpg", 2);
        verify(poiImages).add(5, "/uploads/poi-images/new-3.jpg", 3);
        verify(imageStorage).deleteByPublicUrls(oldPaths);
        assertThat(response.images()).hasSize(3);
    }

    @Test
    void updateWithoutNewImagesKeepsExistingImages() throws Exception {
        Poi poi = savedWithId(new Poi(), 6);
        poi.setName("Test POI");
        when(pois.findById(6)).thenReturn(java.util.Optional.of(poi));
        when(pois.save(any(Poi.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(poiImages.findPaths(6)).thenReturn(List.of("/uploads/poi-images/existing.jpg"));
        AdminPoiService service = new AdminPoiService(pois, contentService, poiImages, imageStorage);

        service.update(6, request(), List.of());

        verify(poiImages, never()).deleteAll(6);
        verify(poiImages, never()).add(any(), any(), anyInt());
        verifyNoInteractions(imageStorage);
    }

    @Test
    void approvingOwnerPoiMakesItsReviewStatusApproved() throws Exception {
        Poi poi = savedWithId(new Poi(), 4);
        poi.setName("Test POI");
        when(pois.findById(4)).thenReturn(java.util.Optional.of(poi));
        when(pois.save(any(Poi.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(poiImages.findPaths(4)).thenReturn(List.of());
        AdminPoiService service = new AdminPoiService(pois, contentService, poiImages, imageStorage);

        var response = service.review(4, "APPROVED", null);

        assertThat(response.approvalStatus()).isEqualTo("APPROVED");
        assertThat(response.rejectionReason()).isNull();
    }

    private AdminPoiService.PoiMutationRequest request() {
        return new AdminPoiService.PoiMutationRequest("Test POI", new BigDecimal("15.123456"),
                new BigDecimal("108.123456"), 30, 2, "Description", null, "ACTIVE");
    }

    private Poi savedWithId(Poi poi, int id) throws Exception {
        Field field = Poi.class.getDeclaredField("id");
        field.setAccessible(true);
        field.set(poi, id);
        return poi;
    }
}
