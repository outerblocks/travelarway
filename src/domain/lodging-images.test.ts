import { describe, expect, it } from 'vitest';
import { displayLodgingText, lodgingDisplayUrl, lodgingPhotoUrls, looksLikeHumanRoomName, photosForStayRoom, pictureRank } from '@/domain/lodging-images';

describe('lodgingDisplayUrl', () => {
  it('promotes Expedia/TravelAPI size tokens to the 1000px cut', () => {
    expect(lodgingDisplayUrl('https://i.travelapi.com/lodging/1/room_t.jpg')).toBe(
      'https://i.travelapi.com/lodging/1/room_z.jpg',
    );
    expect(lodgingDisplayUrl('https://i.travelapi.com/lodging/1/room_b.JPEG')).toBe(
      'https://i.travelapi.com/lodging/1/room_z.JPEG',
    );
    expect(lodgingDisplayUrl('https://i.travelapi.com/lodging/1/room_z.jpg')).toBe(
      'https://i.travelapi.com/lodging/1/room_z.jpg',
    );
  });

  it('leaves unrelated https URLs alone, upgrades known http CDNs, and drops duplicates after promotion', () => {
    expect(lodgingDisplayUrl('https://images.example.com/front.jpg')).toBe(
      'https://images.example.com/front.jpg',
    );
    expect(lodgingDisplayUrl('http://i.travelapi.com/lodging/1/room_b.jpg?w=300')).toBe(
      'https://i.travelapi.com/lodging/1/room_z.jpg',
    );
    expect(lodgingPhotoUrls([
      'https://i.travelapi.com/lodging/1/room_b.jpg',
      'https://i.travelapi.com/lodging/1/room_t.jpg',
      'http://insecure.example.com/skip.jpg',
    ])).toEqual(['https://i.travelapi.com/lodging/1/room_z.jpg']);
  });

  it('title-cases shouting GDS names and rejects booking-code room labels', () => {
    expect(displayLodgingText('SEA CLIFF HOTEL')).toBe('Sea Cliff Hotel');
    expect(looksLikeHumanRoomName('Deluxe Guest Room, 2 Twin')).toBe(true);
    expect(looksLikeHumanRoomName('E00SM3E')).toBe(false);
  });

  it('keeps guest rooms ahead of exteriors and skips logos', () => {
    expect(pictureRank('GuestRoom')).toBe(0);
    expect(pictureRank('Exterior')).toBe(1);
    expect(pictureRank('Logo')).toBeNull();
  });
});

describe('photosForStayRoom', () => {
  it('uses the rate images Travelport sent on the offering', () => {
    expect(photosForStayRoom(
      'Deluxe King',
      [{ url: 'https://i.travelapi.com/lodging/1/king_t.jpg', pictureOf: 'GuestRoom', caption: '' }],
      [{ url: 'https://i.travelapi.com/lodging/1/lobby_t.jpg', pictureOf: 'Lobby', caption: 'Lobby' }],
    )).toEqual(['https://i.travelapi.com/lodging/1/king_z.jpg']);
  });

  it('matches property photos by Travelport caption, else GuestRoom pictures only', () => {
    const property = [
      { url: 'https://i.travelapi.com/lodging/1/suite_t.jpg', pictureOf: 'Suite', caption: 'Executive Suite ocean' },
      { url: 'https://i.travelapi.com/lodging/1/twin_t.jpg', pictureOf: 'GuestRoom', caption: 'Twin room' },
      { url: 'https://i.travelapi.com/lodging/1/front_t.jpg', pictureOf: 'Exterior', caption: 'Front' },
    ];
    expect(photosForStayRoom('Executive Suite', [], property)).toEqual([
      'https://i.travelapi.com/lodging/1/suite_z.jpg',
    ]);
    expect(photosForStayRoom('Classic Queen', [], property)).toEqual([
      'https://i.travelapi.com/lodging/1/twin_z.jpg',
    ]);
  });
});
