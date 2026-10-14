import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { ageYears, ApplicantFacts } from './ApplicantFacts';

describe('ApplicantFacts', () => {
  it('computes age from ISO birth date', () => {
    expect(ageYears('2000-01-01')).toBeGreaterThanOrEqual(25);
    expect(ageYears(null)).toBeNull();
    expect(ageYears('not-a-date')).toBeNull();
  });

  it('renders candidate quality score breakdown and VIP talent badge', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ApplicantFacts
          snapshot={{
            birthDate: '1998-05-10',
            gender: 'female',
            sectorCodes: ['gastronomy'],
            occupationCodes: ['barista'],
          }}
          sectors={[
            {
              code: 'gastronomy',
              displayName: 'Gastronomi',
              occupations: [{ code: 'barista', title: 'Barista' }],
            },
          ]}
          candidateScore={{
            totalScore: 94,
            ratingScore: 95,
            reliabilityScore: 100,
            sectorExperienceScore: 92,
            proximityScore: 88,
            completedShiftsCount: 16,
            averageRating: 4.9,
            ratingCount: 14,
            badge: 'top_talent',
          }}
        />,
      );
    });

    const tree = renderer?.toJSON();
    expect(tree).toBeDefined();
    const str = JSON.stringify(tree);
    expect(str).toContain('VIP Yetenek');
    expect(str).toContain('%94 Uyum');
    expect(str).toContain('16 vardiya');
  });
});
