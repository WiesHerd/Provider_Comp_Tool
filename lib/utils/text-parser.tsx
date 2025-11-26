import * as React from 'react';
import { cn } from './cn';

/**
 * Parse description text into formatted React elements
 * Supports headers (##, ###), bullet points, and bold text (**text**)
 */
export function parseDescription(description: string): React.ReactNode[] {
  // Ensure description is a string
  if (!description || typeof description !== 'string') {
    return [];
  }
  
  // Normalize the description - handle both actual newlines and escaped \n
  // Replace literal \n strings with actual newlines if they exist
  const normalizedDescription = description.replace(/\\n/g, '\n');
  const lines = normalizedDescription.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let currentSection: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let inList = false;
  let inSection = false;

  const flushList = () => {
    if (currentList.length > 0) {
      const listElement = (
        <ul key={`list-${currentSection.length}`} className="list-disc list-outside space-y-2 ml-5 pl-1 text-gray-700 dark:text-gray-300">
          {currentList}
        </ul>
      );
      currentSection.push(listElement);
      currentList = [];
      inList = false;
    }
  };

  const flushSection = () => {
    if (currentSection.length > 0) {
      elements.push(
        <div key={`section-${elements.length}`} className="space-y-4">
          {currentSection}
        </div>
      );
      currentSection = [];
      inSection = false;
    }
  };

  // Process bold text markers (**text** or **text**:)
  const processBoldText = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      // Add bold text
      parts.push(
        <strong key={`bold-${parts.length}`} className="font-semibold text-gray-900 dark:text-white">
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    if (trimmedLine === '') {
      if (inList) {
        flushList();
      }
      return;
    }

    // Handle headers (## Header)
    if (trimmedLine.startsWith('## ')) {
      flushList();
      flushSection();
      const headerText = trimmedLine.substring(3).trim();
      elements.push(
        <h3
          key={`header-${index}`}
          className={cn(
            "font-semibold text-gray-900 dark:text-white mb-4 mt-6 first:mt-0",
            "text-lg sm:text-xl"
          )}
        >
          {headerText}
        </h3>
      );
      return;
    }

    // Handle subheaders (### Subheader)
    if (trimmedLine.startsWith('### ')) {
      flushList();
      flushSection();
      const subheaderText = trimmedLine.substring(4).trim();
      elements.push(
        <h4
          key={`subheader-${index}`}
          className={cn(
            "font-semibold text-gray-900 dark:text-white mb-3 mt-5 first:mt-0",
            "text-base sm:text-lg"
          )}
        >
          {subheaderText}
        </h4>
      );
      return;
    }

    // Handle bullet points
    // Support both at start of line and with 2+ spaces of indentation
    const bulletMatch = trimmedLine.match(/^[\u2022\-\*]|^\s{2,}[\u2022\-\*]/);
    if (bulletMatch) {
      // If we're not in a list, start one
      if (!inList) {
        inList = true;
      }
      // Remove bullet character and any leading whitespace, then trim
      const content = trimmedLine.replace(/^[\u2022\-\*]\s*|^\s{2,}[\u2022\-\*]\s*/, '').trim();
      const processedContent = processBoldText(content);
      currentList.push(
        <li key={`bullet-${index}`} className="leading-relaxed">
          {processedContent}
        </li>
      );
      if (!inSection) {
        inSection = true;
      }
      return;
    }

    // If we hit a non-list item while in a list, flush it
    if (inList) {
      flushList();
    }

    // Handle regular paragraphs
    const processedContent = processBoldText(trimmedLine);
    currentSection.push(
      <p key={`para-${index}`} className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed last:mb-0">
        {processedContent}
      </p>
    );
    if (!inSection) {
      inSection = true;
    }
  });

  // Flush any remaining lists and sections
  flushList();
  flushSection();

  return elements;
}

