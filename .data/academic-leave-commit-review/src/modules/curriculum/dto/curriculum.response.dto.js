/**
 * @typedef {Object} AcademicProgramDto
 * @property {string | null} id
 * @property {string | null} name
 * @property {string | null} facultyId
 * @property {string | null} facultyName
 * @property {string | null} majorCode
 * @property {string | null} majorName
 * @property {string | null} specialization
 * @property {string | null} educationLevelCode
 * @property {string | null} trainingLanguageCode
 * @property {number | null} semesters
 * @property {number | null} requiredCredits
 * @property {number | null} electiveCredits
 * @property {number | null} requiredCompulsoryCredits
 * @property {Date | string | null} startDate
 * @property {Date | string | null} endDate
 */

/**
 * @typedef {Object} CurriculumCourseDto
 * @property {number} id
 * @property {string | null} courseId
 * @property {string | null} courseName
 * @property {string | null} courseShortName
 * @property {number | null} credits
 * @property {number | null} semester
 * @property {string | null} semesterText
 * @property {number | null} order
 * @property {string | null} alternativeCourseId
 * @property {number | null} electiveFlag
 * @property {number | null} preProjectFlag
 * @property {number | null} projectPrerequisiteFlag
 * @property {number | null} graduationProjectFlag
 * @property {string | null} notes
 * @property {number | null} assessmentType
 * @property {string | null} assessmentGroup
 */

/**
 * @typedef {Object} CourseRequirementDto
 * @property {number} id
 * @property {string | null} courseId
 * @property {string | null} requiredCourseId
 * @property {string | null} requiredCourseName
 * @property {number | null} sourceRequirementType
 * @property {string | null} type
 * @property {number | null} alternativeCondition
 * @property {string | null} notes
 */

/**
 * @typedef {Object} CurriculumCountsDto
 * @property {number} curriculumRows
 * @property {number} rowsWithoutReplacement
 * @property {number} rowsWithReplacement
 * @property {number} requirementRows
 * @property {number} missingCourseMetadata
 * @property {number} missingRequirementMetadata
 */

/**
 * @typedef {Object} CurriculumCoverageDto
 * @property {number | null} expectedSemesters
 * @property {number[]} availableSemesters
 * @property {number[]} missingSemesters
 * @property {boolean | null} hasAllSemesters
 */

/**
 * @typedef {Object} CurriculumResponseDto
 * @property {AcademicProgramDto} program
 * @property {CurriculumCountsDto} counts
 * @property {CurriculumCoverageDto} coverage
 * @property {CurriculumCourseDto[]} courses
 * @property {CourseRequirementDto[]} requirements
 */

/**
 * @param {CurriculumResponseDto} data
 * @returns {CurriculumResponseDto}
 */
export function createCurriculumResponseDto({ program, counts, coverage, courses, requirements }) {
  return { program, counts, coverage, courses, requirements };
}
